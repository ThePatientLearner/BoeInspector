import type { IsoDate } from "../../../shared/domain/iso-date.js";

/** Vista de una disposición tal y como la consume la web. */
export interface CatalogEntryView {
  readonly id: string;
  readonly publicationDate: IsoDate;
  readonly department: string;
  /** Título oficial del BOE, literal. Se muestra dentro, junto al enlace. */
  readonly title: string;
  /**
   * Título en lenguaje llano. Es el que encabeza cada ficha; nulo mientras
   * la IA no ha resumido todavía, y entonces la web cae al oficial.
   */
  readonly plainTitle: string | null;
  readonly officialHtmlUrl: string;
  readonly officialPdfUrl: string;
  readonly shortPhrase: string | null;
  readonly bulletPoints: readonly string[] | null;
  /** Impacto en el ciudadano, 1-5. Nulo hasta que hay resumen. */
  readonly impact: number | null;
  readonly model: string | null;
  /** Obligatorio mostrarla (condiciones de reutilización del BOE). */
  readonly lastOfficialUpdateAt: IsoDate;
}

export interface CatalogDayView {
  readonly date: IsoDate;
  readonly entries: readonly CatalogEntryView[];
}

/**
 * Referencia mínima a una disposición: lo justo para enumerar el archivo
 * entero sin arrastrar los resúmenes. Existe porque la portada solo muestra
 * los últimos días y, sin una lista completa, las disposiciones antiguas
 * quedan sin ningún enlace que las alcance.
 */
export interface CatalogReferenceView {
  readonly id: string;
  readonly lastOfficialUpdateAt: IsoDate;
}

/**
 * Puerto de lectura del catálogo. `catalog` es el único módulo que la API
 * consulta; se alimenta de los eventos de los demás (CQRS ligero).
 */
export interface CatalogReadModel {
  listDays(limit: number): Promise<CatalogDayView[]>;
  getDay(date: IsoDate): Promise<CatalogDayView | null>;
  getEntry(id: string): Promise<CatalogEntryView | null>;
  /** Todas las disposiciones publicadas, de la más reciente a la más antigua. */
  listReferences(): Promise<CatalogReferenceView[]>;
}
