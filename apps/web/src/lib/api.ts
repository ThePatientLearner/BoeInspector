/** Cliente mínimo de la API del monolito (solo lectura). */

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export interface CatalogEntry {
  id: string;
  publicationDate: string;
  department: string;
  title: string;
  officialHtmlUrl: string;
  officialPdfUrl: string;
  shortPhrase: string | null;
  bulletPoints: string[] | null;
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
