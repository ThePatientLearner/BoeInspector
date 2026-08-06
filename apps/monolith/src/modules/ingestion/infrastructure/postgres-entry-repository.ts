import { eq } from "drizzle-orm";
import type { Database } from "../../../shared/db/connection.js";
import { BoeId } from "../../../shared/domain/boe-id.js";
import { isoDate } from "../../../shared/domain/iso-date.js";
import { BoeEntry, type EntryStatus } from "../domain/boe-entry.js";
import type { EntryRepository } from "../domain/entry-repository.js";
import { entries } from "./schema.js";

type EntryRow = typeof entries.$inferSelect;

/**
 * Persistencia de disposiciones en el schema `ingestion`.
 *
 * `save` es un UPSERT sobre la clave natural (BOE-A-…): sirve tanto para
 * dar de alta una disposición nueva como para guardar un cambio de estado,
 * y hace que re-ejecutar la ingesta del mismo día no duplique nada.
 */
export class PostgresEntryRepository implements EntryRepository {
  constructor(private readonly db: Database) {}

  async save(entry: BoeEntry): Promise<void> {
    const props = entry.toProps();
    const values = {
      id: props.id.value,
      publicationDate: props.publicationDate,
      section: props.section,
      department: props.department,
      title: props.title,
      officialHtmlUrl: props.officialHtmlUrl,
      officialPdfUrl: props.officialPdfUrl,
      officialXmlUrl: props.officialXmlUrl,
      rawText: props.rawText,
      status: props.status,
      lastOfficialUpdateAt: props.lastOfficialUpdateAt,
    };

    await this.db
      .insert(entries)
      .values(values)
      .onConflictDoUpdate({
        target: entries.id,
        set: { ...values, updatedAt: new Date() },
      });
  }

  async exists(id: BoeId): Promise<boolean> {
    const found = await this.db
      .select({ id: entries.id })
      .from(entries)
      .where(eq(entries.id, id.value))
      .limit(1);
    return found.length > 0;
  }

  async findById(id: BoeId): Promise<BoeEntry | null> {
    const rows = await this.db.select().from(entries).where(eq(entries.id, id.value)).limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async findByStatus(status: EntryStatus): Promise<BoeEntry[]> {
    const rows = await this.db.select().from(entries).where(eq(entries.status, status));
    return rows.map(toDomain);
  }
}

/**
 * Reconstruye la entidad desde la fila. Los value objects se validan igual
 * que si el dato viniera de fuera: una fila que no pasa la validación es
 * corrupción de datos y debe explotar aquí, no propagarse silenciosamente.
 */
function toDomain(row: EntryRow): BoeEntry {
  const id = BoeId.create(row.id);
  if (!id.ok) throw new Error(`Fila corrupta en ingestion.entries: ${id.error.message}`);

  const publicationDate = isoDate(row.publicationDate);
  if (!publicationDate.ok) {
    throw new Error(`Fila corrupta en ingestion.entries (${row.id}): ${publicationDate.error.message}`);
  }

  const lastOfficialUpdateAt = isoDate(row.lastOfficialUpdateAt);
  if (!lastOfficialUpdateAt.ok) {
    throw new Error(
      `Fila corrupta en ingestion.entries (${row.id}): ${lastOfficialUpdateAt.error.message}`,
    );
  }

  return BoeEntry.restore({
    id: id.value,
    publicationDate: publicationDate.value,
    section: row.section,
    department: row.department,
    title: row.title,
    officialHtmlUrl: row.officialHtmlUrl,
    officialPdfUrl: row.officialPdfUrl,
    officialXmlUrl: row.officialXmlUrl,
    rawText: row.rawText,
    status: row.status,
    lastOfficialUpdateAt: lastOfficialUpdateAt.value,
  });
}
