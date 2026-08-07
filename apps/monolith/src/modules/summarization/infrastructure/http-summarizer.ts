import { z } from "zod";
import { err, ok, type Result } from "../../../shared/domain/result.js";
import type { ImpactLevel } from "../domain/summary.js";
import type { Summarizer, SummaryDraft } from "../domain/summarizer.js";

/**
 * Adapter de IA por HTTP contra cualquier API compatible con el formato
 * de OpenAI (MiniMax, OpenAI, DeepSeek, Groq, Ollama…). Cambiar de
 * proveedor es cambiar AI_BASE_URL, AI_MODEL y AI_API_KEY: ni una línea
 * de código.
 *
 * Sustituye al adapter que invocaba el CLI de opencode. Medido contra la
 * API real: ~10 s por resumen aquí frente a más de 3 minutos por el CLI,
 * que arranca una sesión agéntica completa (con herramientas y contexto
 * del directorio) para cada llamada.
 *
 * Trabaja en dos pasadas:
 *   1. Redacción: genera el borrador del resumen.
 *   2. Revisión:  se le devuelve el borrador junto al texto oficial y se
 *      le pide que corrija idioma, fidelidad y claridad.
 * La segunda pasada duplica el coste (que sigue siendo de céntimos) y
 * detecta justo los fallos que la primera comete: palabras coladas en
 * otro alfabeto y afirmaciones que no están en el original.
 */

/**
 * Tope de entrada. Medido contra el BOE real: una disposición de Sección I
 * ronda los 30.000 tokens y las grandes (reales decretos con anexos) llegan
 * a 68.000, así que un tope bajo se comía el articulado sin avisar.
 * 400.000 caracteres son ~100.000 tokens: entran holgadamente en la ventana
 * de contexto de cualquier modelo actual de los que sirven esta API.
 *
 * TODO(fase 2): para las excepcionalmente largas, trocear y resumir por
 * partes en lugar de truncar — truncar pierde el final, donde suelen estar
 * las disposiciones transitorias y la entrada en vigor.
 */
const MAX_INPUT_CHARS = 400_000;

/**
 * Generoso a propósito: los MiniMax son modelos razonadores y gastan tokens
 * pensando ANTES de escribir la respuesta. Con un tope bajo el contenido
 * llega vacío y solo se recibe el razonamiento.
 */
const MAX_OUTPUT_TOKENS = 8_000;

const REQUEST_TIMEOUT_MS = 120_000;

/** El texto que se le pasa al revisor va recortado: solo necesita contrastar. */
const REVIEW_CONTEXT_CHARS = 120_000;

/** Tope del título llano. Por encima deja de caber en una línea en móvil. */
const MAX_PLAIN_TITLE_CHARS = 90;

/**
 * La escala de impacto va literal en los dos prompts. Es lo que la web pinta
 * como indicador, así que tiene que significar lo mismo hoy y dentro de un
 * año: si se toca, los resúmenes antiguos dejan de ser comparables.
 */
const IMPACT_SCALE = [
  "  1 = trámite interno de la Administración; el ciudadano no nota nada.",
  "  2 = afecta a un colectivo pequeño o muy especializado.",
  "  3 = afecta a un colectivo amplio, o cambia precios, tasas o trámites.",
  "  4 = impone obligaciones, plazos o costes relevantes a mucha gente.",
  "  5 = afecta a casi toda la población, o moviliza mucho dinero público.",
].join("\n");

const DRAFT_SYSTEM_PROMPT = [
  "Eres un asistente que resume disposiciones del BOE para ciudadanos sin formación jurídica.",
  "Escribe TODO en español de España. No uses ninguna otra lengua ni alfabeto.",
  "Respondes SIEMPRE con un único objeto JSON válido, sin texto alrededor ni bloques de código.",
  'Forma exacta: {"titulo": "...", "fraseCorta": "...", "puntos": ["...", "..."], "impacto": 3}',
  "",
  "- titulo: máximo 80 caracteres. El título REAL del BOE es ilegible para la",
  "  mayoría; escribe uno que cualquiera entienda de un vistazo. Di QUÉ pasa,",
  "  no cómo se llama la norma. Sin números de norma, sin fechas, sin siglas.",
  '  Mal: "Resolución ISP/1933/2026, de 15 de junio, de modificación de la…"',
  '  Bien: "Nuevos horarios para camiones con mercancías peligrosas en Cataluña"',
  "- fraseCorta: máximo 200 caracteres. Qué cambia y a quién afecta.",
  "- puntos: entre 5 y 8 puntos con lo esencial: a quién aplica, obligaciones,",
  "  plazos, cuantías y entrada en vigor.",
  "- impacto: número entero del 1 al 5, según cuánto afecta a un ciudadano",
  "  corriente o cuánto dinero público mueve:",
  IMPACT_SCALE,
  "",
  "- Lenguaje claro y directo, sin jerga jurídica.",
  "- No inventes nada que no esté en el texto. Si un dato no aparece, no lo menciones.",
].join("\n");

const REVIEW_SYSTEM_PROMPT = [
  "Eres un revisor editorial. Recibes el texto oficial de una disposición del BOE",
  "y un borrador de resumen. Devuelves una versión corregida del resumen.",
  "",
  "Revisa y corrige, por este orden:",
  "1. IDIOMA: todo debe estar en español de España. Sustituye cualquier palabra",
  "   escrita en otra lengua u otro alfabeto por su equivalente en español.",
  "2. FIDELIDAD: elimina o corrige cualquier afirmación que no esté respaldada",
  "   por el texto oficial. No añadas datos que no aparezcan en él.",
  "3. PRECISIÓN: comprueba que fechas, plazos, cuantías y nombres coinciden",
  "   exactamente con el texto oficial.",
  "4. TÍTULO: que se entienda sin conocimientos jurídicos y describa lo que",
  "   pasa, no cómo se llama la norma. Máximo 80 caracteres, sin números de",
  "   norma ni fechas. Si el borrador copia el título oficial, reescríbelo.",
  "5. IMPACTO: comprueba que el número del 1 al 5 encaja con esta escala:",
  IMPACT_SCALE,
  "   Ante la duda entre dos niveles, elige el más bajo.",
  "6. CLARIDAD: frases directas, sin jerga jurídica ni siglas sin explicar.",
  "7. FORMATO: fraseCorta de 200 caracteres como máximo; entre 5 y 8 puntos.",
  "",
  "Si el borrador ya es correcto, devuélvelo sin cambios.",
  "Responde ÚNICAMENTE con el objeto JSON corregido, sin texto alrededor:",
  '{"titulo": "...", "fraseCorta": "...", "puntos": ["...", "..."], "impacto": 3}',
].join("\n");

/**
 * MiniMax es un modelo multilingüe y ocasionalmente cuela palabras en otro
 * alfabeto en mitad de un texto en español (visto en pruebas reales: una
 * palabra en cirílico dentro de un resumen por lo demás correcto).
 * Un resumen así parece roto, así que se rechaza y se reintenta.
 */
const NON_LATIN_SCRIPT = /[Ѐ-ӿ؀-ۿऀ-ॿ一-鿿぀-ヿ가-힯]/;

const draftSchema = z.object({
  // Holgado a propósito: si la IA se pasa de 80 caracteres preferimos recortar
  // nosotros a descartar un resumen por lo demás correcto.
  titulo: z.string().min(1).max(200),
  fraseCorta: z.string().min(1).max(400),
  puntos: z.array(z.string().min(1)).min(3).max(10),
  // A veces devuelve el número como texto ("4"), de ahí la coerción.
  impacto: z.coerce.number().int().min(1).max(5),
});

type Draft = z.infer<typeof draftSchema>;

const apiResponseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable().optional() }) }))
    .min(1),
});

/** Traza de la pasada de revisión, para diagnóstico (la usa `npm run probe`). */
export interface ReviewTrace {
  readonly before: SummaryDraft;
  readonly after: SummaryDraft;
  readonly changed: boolean;
}

export interface HttpSummarizerOptions {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  /** Segunda pasada de revisión. Activada por defecto. */
  readonly review?: boolean;
  readonly onReview?: (trace: ReviewTrace) => void;
}

export class HttpSummarizer implements Summarizer {
  constructor(private readonly options: HttpSummarizerOptions) {}

  async summarize(input: { title: string; text: string }): Promise<Result<SummaryDraft>> {
    const text = input.text.slice(0, MAX_INPUT_CHARS);

    const draft = await this.generateDraft(input.title, text);
    if (!draft.ok) return draft;

    if (this.options.review === false) {
      return ok(this.toSummary(draft.value));
    }

    const reviewed = await this.reviewDraft(input.title, text, draft.value);

    // La revisión mejora, no bloquea: si falla, nos quedamos con el borrador,
    // que ya ha pasado la validación de formato y de alfabeto.
    const finalDraft = reviewed ?? draft.value;
    const summary = this.toSummary(finalDraft);

    this.options.onReview?.({
      before: this.toSummary(draft.value),
      after: summary,
      changed: JSON.stringify(draft.value) !== JSON.stringify(finalDraft),
    });

    return ok(summary);
  }

  private toSummary(draft: Draft): SummaryDraft {
    return {
      plainTitle: truncate(draft.titulo, MAX_PLAIN_TITLE_CHARS),
      shortPhrase: draft.fraseCorta,
      bulletPoints: draft.puntos,
      impact: draft.impacto as ImpactLevel,
      model: this.options.model,
    };
  }

  /** Pasada 1: redacción. Dos intentos ante JSON inválido o alfabeto extraño. */
  private async generateDraft(title: string, text: string): Promise<Result<Draft>> {
    const userPrompt = [`TÍTULO: ${title}`, "", `TEXTO: ${text}`].join("\n");
    let lastError = new Error("La IA no devolvió un resumen utilizable");

    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await this.call(DRAFT_SYSTEM_PROMPT, userPrompt);
      if (!response.ok) {
        lastError = response.error;
        continue;
      }
      const validated = validate(response.value, attempt);
      if (validated.ok) return validated;
      lastError = validated.error;
    }
    return err(lastError);
  }

  /** Pasada 2: revisión. Un solo intento; si falla, se usa el borrador. */
  private async reviewDraft(title: string, text: string, draft: Draft): Promise<Draft | null> {
    const userPrompt = [
      `TÍTULO: ${title}`,
      "",
      `TEXTO OFICIAL: ${text.slice(0, REVIEW_CONTEXT_CHARS)}`,
      "",
      `BORRADOR A REVISAR: ${JSON.stringify(draft)}`,
    ].join("\n");

    const response = await this.call(REVIEW_SYSTEM_PROMPT, userPrompt);
    if (!response.ok) return null;
    const validated = validate(response.value, 1);
    return validated.ok ? validated.value : null;
  }

  private async call(systemPrompt: string, userPrompt: string): Promise<Result<string>> {
    try {
      const response = await fetch(`${this.options.baseUrl}/text/chatcompletion_v2`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.options.model,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text();
        return err(new Error(`La API de IA respondió ${response.status}: ${body.slice(0, 200)}`));
      }

      const parsed = apiResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        return err(new Error("Respuesta de la API con forma inesperada"));
      }
      return ok(parsed.data.choices[0]?.message.content ?? "");
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/** Valida forma JSON y ausencia de alfabetos no latinos. */
function validate(raw: string, attempt: number): Result<Draft> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return err(new Error(`Respuesta sin JSON (intento ${attempt}): ${raw.slice(0, 200)}`));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return err(new Error(`JSON mal formado (intento ${attempt})`));
  }

  const result = draftSchema.safeParse(parsed);
  if (!result.success) {
    return err(new Error(`JSON con forma inesperada (intento ${attempt})`));
  }

  const foreign = [result.data.titulo, result.data.fraseCorta, ...result.data.puntos].find((t) =>
    NON_LATIN_SCRIPT.test(t),
  );
  if (foreign) {
    return err(
      new Error(`Texto en otro alfabeto (intento ${attempt}): "${foreign.slice(0, 80)}"`),
    );
  }

  return ok(result.data);
}

/** Recorta por la última palabra completa, sin partir a mitad. */
function truncate(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
