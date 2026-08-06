import type { BoeId } from "../../../shared/domain/boe-id.js";
import { BoeEntry, type EntryStatus } from "../domain/boe-entry.js";
import type { EntryRepository } from "../domain/entry-repository.js";

/**
 * Repositorio en memoria, solo para tests: permite probar los casos de uso
 * sin levantar Postgres. En producción se usa `PostgresEntryRepository`.
 */
export class InMemoryEntryRepository implements EntryRepository {
  private readonly entries = new Map<string, BoeEntry>();

  async save(entry: BoeEntry): Promise<void> {
    this.entries.set(entry.id.value, BoeEntry.restore(entry.toProps()));
  }

  async exists(id: BoeId): Promise<boolean> {
    return this.entries.has(id.value);
  }

  async findById(id: BoeId): Promise<BoeEntry | null> {
    const found = this.entries.get(id.value);
    return found ? BoeEntry.restore(found.toProps()) : null;
  }

  async findByStatus(status: EntryStatus): Promise<BoeEntry[]> {
    return [...this.entries.values()]
      .filter((entry) => entry.status === status)
      .map((entry) => BoeEntry.restore(entry.toProps()));
  }
}
