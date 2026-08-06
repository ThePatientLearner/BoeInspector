import type { Summary } from "./summary.js";

export interface SummaryRepository {
  save(summary: Summary): Promise<void>;
  findByEntryId(entryId: string): Promise<Summary | null>;
}
