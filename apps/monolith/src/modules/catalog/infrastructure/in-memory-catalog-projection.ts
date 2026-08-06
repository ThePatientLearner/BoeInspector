import type { IsoDate } from "../../../shared/domain/iso-date.js";
import type { EventBus } from "../../../shared/event-bus/event-bus.js";
import type { EntryIngested } from "../../ingestion/index.js";
import type { SummaryGenerated } from "../../summarization/index.js";
import type { CatalogDayView, CatalogEntryView, CatalogReadModel } from "../application/queries.js";

/**
 * Proyección en memoria, solo para tests. En producción se usa
 * `PostgresCatalogProjection`, que además deja constancia en el log si un
 * resumen llega antes que su disposición; aquí se ignora en silencio.
 */
export class InMemoryCatalogProjection implements CatalogReadModel {
  private readonly entries = new Map<string, CatalogEntryView>();

  register(eventBus: EventBus): void {
    eventBus.subscribe<EntryIngested>("ingestion.entry-ingested", async (event) => {
      const p = event.payload;
      this.entries.set(p.entryId, {
        id: p.entryId,
        publicationDate: p.publicationDate,
        department: p.department,
        title: p.title,
        officialHtmlUrl: p.officialHtmlUrl,
        officialPdfUrl: p.officialPdfUrl,
        shortPhrase: null,
        bulletPoints: null,
        model: null,
        lastOfficialUpdateAt: p.lastOfficialUpdateAt,
      });
    });

    eventBus.subscribe<SummaryGenerated>("summarization.summary-generated", async (event) => {
      const p = event.payload;
      const existing = this.entries.get(p.entryId);
      if (!existing) return;
      this.entries.set(p.entryId, {
        ...existing,
        shortPhrase: p.shortPhrase,
        bulletPoints: p.bulletPoints,
        model: p.model,
      });
    });
  }

  async listDays(limit: number): Promise<CatalogDayView[]> {
    const byDate = new Map<IsoDate, CatalogEntryView[]>();
    for (const entry of this.entries.values()) {
      const group = byDate.get(entry.publicationDate) ?? [];
      group.push(entry);
      byDate.set(entry.publicationDate, group);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, limit)
      .map(([date, entries]) => ({ date, entries }));
  }

  async getDay(date: IsoDate): Promise<CatalogDayView | null> {
    const entries = [...this.entries.values()].filter((e) => e.publicationDate === date);
    return entries.length > 0 ? { date, entries } : null;
  }

  async getEntry(id: string): Promise<CatalogEntryView | null> {
    return this.entries.get(id) ?? null;
  }
}
