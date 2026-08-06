import type { IsoDate } from "../../../shared/domain/iso-date.js";

/** Vista de una disposición tal y como la consume la web. */
export interface CatalogEntryView {
  readonly id: string;
  readonly publicationDate: IsoDate;
  readonly department: string;
  readonly title: string;
  readonly officialHtmlUrl: string;
  readonly officialPdfUrl: string;
  readonly shortPhrase: string | null;
  readonly bulletPoints: readonly string[] | null;
  readonly model: string | null;
  /** Obligatorio mostrarla (condiciones de reutilización del BOE). */
  readonly lastOfficialUpdateAt: IsoDate;
}

export interface CatalogDayView {
  readonly date: IsoDate;
  readonly entries: readonly CatalogEntryView[];
}

/**
 * Puerto de lectura del catálogo. `catalog` es el único módulo que la API
 * consulta; se alimenta de los eventos de los demás (CQRS ligero).
 */
export interface CatalogReadModel {
  listDays(limit: number): Promise<CatalogDayView[]>;
  getDay(date: IsoDate): Promise<CatalogDayView | null>;
  getEntry(id: string): Promise<CatalogEntryView | null>;
}
