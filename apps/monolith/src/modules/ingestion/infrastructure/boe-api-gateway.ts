import type { BoeId } from "../../../shared/domain/boe-id.js";
import { isoDate, todayIn, type IsoDate } from "../../../shared/domain/iso-date.js";
import { err, ok, type Result } from "../../../shared/domain/result.js";
import type { BoeEntryContent, BoeGateway, BoeSummaryItem } from "../domain/boe-gateway.js";

const BASE_URL = "https://boe.es/datosabiertos/api/boe/sumario";

/**
 * Adapter contra la API de datos abiertos del BOE.
 *
 * El JSON del sumario anida diario → sección → departamento → epígrafe →
 * ítem, y cada nivel puede llegar como objeto o como array según el día.
 * `toArray` normaliza esa variabilidad.
 *
 * TODO(fase 1): validar el parser contra sumarios reales de varios días
 * (festivos, suplementos, días con secciones vacías).
 */
export class BoeApiGateway implements BoeGateway {
  async fetchDailySummary(date: IsoDate): Promise<Result<BoeSummaryItem[] | null>> {
    const compact = date.replaceAll("-", "");
    try {
      const response = await fetch(`${BASE_URL}/${compact}`, {
        headers: { Accept: "application/json" },
      });
      if (response.status === 404) {
        return ok(null);
      }
      if (!response.ok) {
        return err(new Error(`API del BOE respondió ${response.status}`));
      }
      const body = (await response.json()) as SumarioResponse;
      return ok(parseSummaryItems(body));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async fetchEntryContent(id: BoeId): Promise<Result<BoeEntryContent>> {
    try {
      const response = await fetch(
        `https://www.boe.es/diario_boe/xml.php?id=${encodeURIComponent(id.value)}`,
      );
      if (!response.ok) {
        return err(new Error(`Descarga de ${id.value} respondió ${response.status}`));
      }
      const xml = await response.text();
      const text = extractBodyText(xml);
      if (text.length === 0) {
        return err(new Error(`No se encontró el cuerpo del documento ${id.value}`));
      }
      return ok({ text, lastUpdatedAt: extractLastUpdatedAt(xml) });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/* ── Parsing ──────────────────────────────────────────────────────── */

interface SumarioResponse {
  data?: { sumario?: { diario?: unknown } };
}

function toArray(value: unknown): Record<string, unknown>[] {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

function parseSummaryItems(body: SumarioResponse): BoeSummaryItem[] {
  const items: BoeSummaryItem[] = [];
  for (const diario of toArray(body.data?.sumario?.diario)) {
    for (const seccion of toArray(diario["seccion"])) {
      const sectionCode = String(seccion["codigo"] ?? "");
      for (const departamento of toArray(seccion["departamento"])) {
        const departmentName = String(departamento["nombre"] ?? "");
        for (const epigrafe of toArray(departamento["epigrafe"])) {
          for (const item of toArray(epigrafe["item"])) {
            const parsed = parseItem(item, sectionCode, departmentName);
            if (parsed) items.push(parsed);
          }
        }
        // Algunos departamentos llevan ítems directamente, sin epígrafe.
        for (const item of toArray(departamento["item"])) {
          const parsed = parseItem(item, sectionCode, departmentName);
          if (parsed) items.push(parsed);
        }
      }
    }
  }
  return items;
}

function parseItem(
  item: Record<string, unknown>,
  section: string,
  department: string,
): BoeSummaryItem | null {
  const id = item["identificador"];
  if (typeof id !== "string" || id.length === 0) return null;
  const url = (key: string): string | null => {
    const value = item[key];
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "texto" in value) {
      return String((value as { texto: unknown }).texto);
    }
    return null;
  };
  return {
    id,
    title: String(item["titulo"] ?? ""),
    section,
    department,
    htmlUrl: url("url_html") ?? `https://www.boe.es/diario_boe/txt.php?id=${id}`,
    pdfUrl: url("url_pdf") ?? `https://www.boe.es/boe/dias/pdfs/${id}.pdf`,
    xmlUrl: url("url_xml"),
  };
}

/**
 * Extrae el cuerpo de la disposición del XML.
 *
 * Un documento del BOE trae VARIOS bloques <texto>: los de
 * <analisis><referencias> son citas a otras normas ("el art. 94 de la Ley
 * 34/1998…") y solo el último contiene el articulado real. Coger el primero
 * devolvía fragmentos de decenas de caracteres y la IA resumía sobre nada.
 * Nos quedamos con el bloque más largo, que es robusto aunque cambie el orden.
 */
function extractBodyText(xml: string): string {
  const blocks = [...xml.matchAll(/<texto>([\s\S]*?)<\/texto>/g)].map((match) => match[1] ?? "");
  if (blocks.length === 0) return "";
  const longest = blocks.reduce((a, b) => (b.length > a.length ? b : a));
  return stripMarkup(longest);
}

function stripMarkup(fragment: string): string {
  return fragment
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `<documento fecha_actualizacion="20260720115602">` → "2026-07-20".
 * Si el atributo faltara, se cae a la fecha de hoy antes que publicar
 * una fecha inventada.
 */
function extractLastUpdatedAt(xml: string): IsoDate {
  const match = xml.match(/fecha_actualizacion="(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const parsed = isoDate(`${match[1]}-${match[2]}-${match[3]}`);
    if (parsed.ok) return parsed.value;
  }
  return todayIn("Europe/Madrid");
}
