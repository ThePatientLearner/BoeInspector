import type { BoeId } from "../../../shared/domain/boe-id.js";
import type { IsoDate } from "../../../shared/domain/iso-date.js";
import type { Result } from "../../../shared/domain/result.js";

/** Ítem del sumario diario tal y como lo necesita el dominio. */
export interface BoeSummaryItem {
  readonly id: string;
  readonly title: string;
  readonly section: string;
  readonly department: string;
  readonly htmlUrl: string;
  readonly pdfUrl: string;
  readonly xmlUrl: string | null;
}

/** Contenido de una disposición descargada del BOE. */
export interface BoeEntryContent {
  readonly text: string;
  /**
   * Fecha de última actualización del documento oficial, según el propio
   * XML del BOE. Hay que mostrarla: lo exigen las condiciones de
   * reutilización (ver LEGAL.md §1.4).
   */
  readonly lastUpdatedAt: IsoDate;
}

/**
 * Puerto hacia el BOE. La implementación real usa la API de datos
 * abiertos (https://boe.es/datosabiertos/api); los tests usan un fake
 * con sumarios grabados de días reales.
 */
export interface BoeGateway {
  /** null = ese día no hubo boletín (la API devuelve 404 los domingos/festivos). */
  fetchDailySummary(date: IsoDate): Promise<Result<BoeSummaryItem[] | null>>;
  fetchEntryContent(id: BoeId): Promise<Result<BoeEntryContent>>;
}
