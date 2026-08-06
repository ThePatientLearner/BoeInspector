import type { EventBus } from "../../../shared/event-bus/event-bus.js";
import type { Logger } from "../../../shared/logger/logger.js";
import type { EntryIngested } from "../../ingestion/index.js";
import { summaryGenerated } from "../domain/events.js";
import type { Summarizer } from "../domain/summarizer.js";
import type { SummaryRepository } from "../domain/summary-repository.js";

/**
 * Reacciona a EntryIngested: pide el resumen a la IA, lo persiste y
 * emite SummaryGenerated. Idempotente: si ya hay resumen para esa
 * entrada, no vuelve a llamar a la IA.
 */
export class SummarizeEntry {
  constructor(
    private readonly summarizer: Summarizer,
    private readonly repository: SummaryRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  register(eventBus: EventBus): void {
    eventBus.subscribe<EntryIngested>("ingestion.entry-ingested", (event) =>
      this.handle(event),
    );
  }

  private async handle(event: EntryIngested): Promise<void> {
    const { entryId, title, text } = event.payload;

    if (await this.repository.findByEntryId(entryId)) {
      this.logger.debug({ entryId }, "Resumen ya existente, se omite");
      return;
    }

    const draft = await this.summarizer.summarize({ title, text });
    if (!draft.ok) {
      this.logger.error({ entryId, error: draft.error.message }, "Fallo generando el resumen");
      return;
    }

    await this.repository.save({
      entryId,
      shortPhrase: draft.value.shortPhrase,
      bulletPoints: draft.value.bulletPoints,
      model: draft.value.model,
      generatedAt: new Date(),
    });

    await this.eventBus.publish(
      summaryGenerated({
        entryId,
        publicationDate: event.payload.publicationDate,
        title,
        shortPhrase: draft.value.shortPhrase,
        bulletPoints: draft.value.bulletPoints,
        officialHtmlUrl: event.payload.officialHtmlUrl,
        model: draft.value.model,
      }),
    );
  }
}
