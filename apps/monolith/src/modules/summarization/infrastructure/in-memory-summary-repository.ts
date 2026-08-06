import type { Summary } from "../domain/summary.js";
import type { SummaryRepository } from "../domain/summary-repository.js";

/** Solo para tests; en producción se usa `PostgresSummaryRepository`. */
export class InMemorySummaryRepository implements SummaryRepository {
  private readonly summaries = new Map<string, Summary>();

  async save(summary: Summary): Promise<void> {
    this.summaries.set(summary.entryId, summary);
  }

  async findByEntryId(entryId: string): Promise<Summary | null> {
    return this.summaries.get(entryId) ?? null;
  }
}
