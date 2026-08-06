/**
 * `npm run probe`
 *
 * Prueba de humo end-to-end con UNA sola disposición: la más reciente
 * disponible en el BOE. Recorre la cadena completa —API del BOE, parser
 * del sumario, extracción del texto, IA, validación del JSON— e imprime
 * cada paso, sin tocar la base de datos ni enviar notificaciones.
 *
 * Es el comando para responder a "¿esto funciona de verdad?" sin esperar
 * a las 8:30 de la mañana ni gastar tokens en el boletín entero.
 */
import { loadConfig } from "../shared/config/config.js";
import { BoeId } from "../shared/domain/boe-id.js";
import { BoeApiGateway } from "../modules/ingestion/index.js";
import { HttpSummarizer, type ReviewTrace } from "../modules/summarization/index.js";
import { findLatestDayWithEntries } from "./find-latest-day.js";

function line(): void {
  console.log("─".repeat(72));
}

async function main(): Promise<void> {
  const config = loadConfig();
  const sections = config.boeSections.split(",");
  const gateway = new BoeApiGateway();

  line();
  console.log(`Modelo de IA : ${config.aiModel} (${config.aiBaseUrl})`);
  console.log(`Secciones    : ${sections.join(", ")}`);
  line();

  console.log("\n[1/4] Buscando el último boletín con disposiciones…");
  const latest = await findLatestDayWithEntries(gateway, sections, config.timeZone);
  if (!latest) {
    console.error("No se ha encontrado ningún boletín en las últimas 3 semanas.");
    process.exitCode = 1;
    return;
  }
  console.log(`      BOE del ${latest.date} · ${latest.items.length} disposiciones en sección(es) ${sections.join(",")}`);

  // La última del sumario es la más reciente del día.
  const item = latest.items[latest.items.length - 1];
  if (!item) return;
  const id = BoeId.create(item.id);
  if (!id.ok) {
    console.error(`      Identificador inválido: ${item.id}`);
    process.exitCode = 1;
    return;
  }

  console.log("\n[2/4] Disposición elegida");
  console.log(`      id      : ${item.id}`);
  console.log(`      depto.  : ${item.department}`);
  console.log(`      título  : ${item.title.slice(0, 100)}${item.title.length > 100 ? "…" : ""}`);
  console.log(`      oficial : ${item.htmlUrl}`);

  console.log("\n[3/4] Descargando el texto oficial…");
  const content = await gateway.fetchEntryContent(id.value);
  if (!content.ok) {
    console.error(`      ERROR: ${content.error.message}`);
    process.exitCode = 1;
    return;
  }
  const approxTokens = Math.round(content.value.text.length / 4);
  console.log(`      ${content.value.text.length} caracteres (~${approxTokens} tokens)`);
  console.log(`      última actualización oficial: ${content.value.lastUpdatedAt}`);

  console.log("\n[4/4] Redactando el resumen y revisándolo…");
  const startedAt = Date.now();
  let trace: ReviewTrace | null = null;
  const summarizer = new HttpSummarizer({
    baseUrl: config.aiBaseUrl,
    model: config.aiModel,
    apiKey: config.aiApiKey,
    review: config.aiReview,
    onReview: (t) => {
      trace = t;
    },
  });
  const draft = await summarizer.summarize({ title: item.title, text: content.value.text });
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (!draft.ok) {
    console.error(`      ERROR tras ${elapsed}s: ${draft.error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`      Resumen recibido y validado en ${elapsed}s`);

  const review = trace as ReviewTrace | null;
  if (!config.aiReview) {
    console.log("      (pasada de revisión desactivada por AI_REVIEW=false)");
  } else if (review === null) {
    console.log("      La revisión no pudo completarse; se usa el borrador original.");
  } else if (!review.changed) {
    console.log("      La revisión no encontró nada que corregir.");
  } else {
    console.log("      La revisión corrigió el borrador. BORRADOR ORIGINAL:\n");
    line();
    console.log(review.before.shortPhrase);
    for (const point of review.before.bulletPoints) console.log(`  • ${point}`);
  }
  console.log();
  line();
  console.log(`FRASE CORTA (${draft.value.shortPhrase.length} caracteres)`);
  console.log(draft.value.shortPhrase);
  console.log();
  console.log(`PUNTOS CLAVE (${draft.value.bulletPoints.length})`);
  for (const point of draft.value.bulletPoints) {
    console.log(`  • ${point}`);
  }
  line();
  console.log("\nComprueba a mano que el resumen se corresponde con el texto oficial:");
  console.log(item.htmlUrl);
}

main().catch((error) => {
  console.error("Fallo inesperado:", error);
  process.exit(1);
});
