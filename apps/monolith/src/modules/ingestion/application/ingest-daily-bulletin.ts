import { BoeId } from "../../../shared/domain/boe-id.js";
import type { IsoDate } from "../../../shared/domain/iso-date.js";
import { err, ok, type Result } from "../../../shared/domain/result.js";
import type { EventBus } from "../../../shared/event-bus/event-bus.js";
import type { Logger } from "../../../shared/logger/logger.js";
import { BoeEntry } from "../domain/boe-entry.js";
import type { BoeGateway } from "../domain/boe-gateway.js";
import type { EntryRepository } from "../domain/entry-repository.js";
import { entryIngested } from "../domain/events.js";

export interface IngestReport {
  readonly date: IsoDate;
  readonly bulletinPublished: boolean;
  readonly newEntries: number;
  readonly skippedExisting: number;
  readonly failures: number;
}

/**
 * Caso de uso principal de la ingesta: sumario del día → filtrar sección →
 * detectar nuevas → descargar texto → persistir → emitir EntryIngested.
 *
 * Idempotente por diseño: la clave natural (BOE-A-…) hace que re-ejecutarlo
 * solo procese lo que falta.
 */
export class IngestDailyBulletin {
  constructor(
    private readonly gateway: BoeGateway,
    private readonly repository: EntryRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
    private readonly sections: readonly string[],
  ) {}

  async execute(date: IsoDate): Promise<Result<IngestReport>> {
    const summary = await this.gateway.fetchDailySummary(date);
    if (!summary.ok) {
      return err(summary.error);
    }
    if (summary.value === null) {
      this.logger.info({ date }, "Sin boletín este día");
      return ok({ date, bulletinPublished: false, newEntries: 0, skippedExisting: 0, failures: 0 });
    }

    const items = summary.value.filter((item) => this.sections.includes(item.section));
    let newEntries = 0;
    let skippedExisting = 0;
    let failures = 0;

    for (const item of items) {
      const id = BoeId.create(item.id);
      if (!id.ok) {
        this.logger.warn({ raw: item.id }, "Ítem del sumario con identificador inválido");
        failures += 1;
        continue;
      }

      if (await this.repository.exists(id.value)) {
        skippedExisting += 1;
        continue;
      }

      const content = await this.gateway.fetchEntryContent(id.value);
      if (!content.ok) {
        this.logger.error(
          { id: id.value.value, error: content.error.message },
          "Fallo descargando el contenido",
        );
        failures += 1;
        continue;
      }

      const entry = BoeEntry.ingest({
        id: id.value,
        publicationDate: date,
        section: item.section,
        department: item.department,
        title: item.title,
        officialHtmlUrl: item.htmlUrl,
        officialPdfUrl: item.pdfUrl,
        officialXmlUrl: item.xmlUrl,
        rawText: content.value.text,
        lastOfficialUpdateAt: content.value.lastUpdatedAt,
      });

      await this.repository.save(entry);
      await this.eventBus.publish(
        entryIngested({
          entryId: id.value.value,
          publicationDate: date,
          department: item.department,
          title: item.title,
          officialHtmlUrl: item.htmlUrl,
          officialPdfUrl: item.pdfUrl,
          text: content.value.text,
          lastOfficialUpdateAt: content.value.lastUpdatedAt,
        }),
      );
      newEntries += 1;
    }

    this.logger.info({ date, newEntries, skippedExisting, failures }, "Ingesta completada");
    return ok({ date, bulletinPublished: true, newEntries, skippedExisting, failures });
  }
}
