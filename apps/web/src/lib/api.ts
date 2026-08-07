/** Cliente mínimo de la API del monolito (solo lectura). */

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export interface CatalogEntry {
  id: string;
  publicationDate: string;
  department: string;
  /** Título oficial del BOE, literal. */
  title: string;
  /** Título en lenguaje llano; nulo hasta que la IA resume. */
  plainTitle: string | null;
  officialHtmlUrl: string;
  officialPdfUrl: string;
  shortPhrase: string | null;
  bulletPoints: string[] | null;
  /** Impacto en el ciudadano, 1-5. Nulo hasta que hay resumen. */
  impact: number | null;
  model: string | null;
  lastOfficialUpdateAt: string;
}

export interface CatalogDay {
  date: string;
  entries: CatalogEntry[];
}

export async function fetchDays(): Promise<CatalogDay[] | null> {
  try {
    const response = await fetch(`${API_URL}/api/days`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return (await response.json()) as CatalogDay[];
  } catch {
    return null;
  }
}

/** Referencia mínima de cada disposición del archivo; la usa el sitemap. */
export interface CatalogReference {
  id: string;
  lastOfficialUpdateAt: string;
}

export async function fetchAllReferences(): Promise<CatalogReference[]> {
  try {
    const response = await fetch(`${API_URL}/api/entries`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    return (await response.json()) as CatalogReference[];
  } catch {
    return [];
  }
}

export async function fetchEntry(id: string): Promise<CatalogEntry | null> {
  try {
    const response = await fetch(`${API_URL}/api/entries/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as CatalogEntry;
  } catch {
    return null;
  }
}
