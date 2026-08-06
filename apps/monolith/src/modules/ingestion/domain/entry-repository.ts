import type { BoeId } from "../../../shared/domain/boe-id.js";
import type { BoeEntry, EntryStatus } from "./boe-entry.js";

export interface EntryRepository {
  save(entry: BoeEntry): Promise<void>;
  exists(id: BoeId): Promise<boolean>;
  findById(id: BoeId): Promise<BoeEntry | null>;
  findByStatus(status: EntryStatus): Promise<BoeEntry[]>;
}
