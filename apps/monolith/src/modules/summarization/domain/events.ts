import type { DomainEvent } from "../../../shared/event-bus/domain-event.js";
import type { IsoDate } from "../../../shared/domain/iso-date.js";

/**
 * Payload denormalizado: lleva título y enlaces (que llegaron con
 * EntryIngested) para que `notifications` no tenga que consultar a nadie.
 */
export type SummaryGenerated = DomainEvent<
  "summarization.summary-generated",
  {
    entryId: string;
    publicationDate: IsoDate;
    title: string;
    shortPhrase: string;
    bulletPoints: readonly string[];
    officialHtmlUrl: string;
    model: string;
  }
>;

export function summaryGenerated(payload: SummaryGenerated["payload"]): SummaryGenerated {
  return { name: "summarization.summary-generated", occurredAt: new Date(), payload };
}
