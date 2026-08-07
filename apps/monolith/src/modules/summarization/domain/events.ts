import type { DomainEvent } from "../../../shared/event-bus/domain-event.js";
import type { IsoDate } from "../../../shared/domain/iso-date.js";
import type { ImpactLevel } from "./summary.js";

/**
 * Payload denormalizado: lleva título y enlaces (que llegaron con
 * EntryIngested) para que `notifications` no tenga que consultar a nadie.
 */
export type SummaryGenerated = DomainEvent<
  "summarization.summary-generated",
  {
    entryId: string;
    publicationDate: IsoDate;
    /** Título oficial del BOE, literal. */
    title: string;
    /** Título en lenguaje llano generado por la IA; es el que se muestra. */
    plainTitle: string;
    shortPhrase: string;
    bulletPoints: readonly string[];
    impact: ImpactLevel;
    officialHtmlUrl: string;
    model: string;
  }
>;

export function summaryGenerated(payload: SummaryGenerated["payload"]): SummaryGenerated {
  return { name: "summarization.summary-generated", occurredAt: new Date(), payload };
}
