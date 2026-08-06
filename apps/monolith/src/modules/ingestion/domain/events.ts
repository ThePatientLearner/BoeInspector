import type { DomainEvent } from "../../../shared/event-bus/domain-event.js";
import type { IsoDate } from "../../../shared/domain/iso-date.js";

/**
 * Se emite por cada disposición nueva persistida. El payload lleva todo
 * lo que los consumidores necesitan (título, texto, enlaces): un módulo
 * no lee las tablas de otro.
 */
export type EntryIngested = DomainEvent<
  "ingestion.entry-ingested",
  {
    entryId: string;
    publicationDate: IsoDate;
    department: string;
    title: string;
    officialHtmlUrl: string;
    officialPdfUrl: string;
    text: string;
    /**
     * Fecha real de última actualización del documento oficial. Viaja en el
     * evento porque el catálogo está OBLIGADO a mostrarla (condiciones de
     * reutilización del BOE, ver LEGAL.md) y no puede leer las tablas de
     * ingestion para averiguarla.
     */
    lastOfficialUpdateAt: IsoDate;
  }
>;

export function entryIngested(payload: EntryIngested["payload"]): EntryIngested {
  return { name: "ingestion.entry-ingested", occurredAt: new Date(), payload };
}
