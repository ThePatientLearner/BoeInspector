import { desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../../shared/db/connection.js";
import { isoDate, type IsoDate } from "../../../shared/domain/iso-date.js";
import type { Logger } from "../../../shared/logger/logger.js";
import type { EventBus } from "../../../shared/event-bus/event-bus.js";
import type { EntryIngested } from "../../ingestion/index.js";
import type { SummaryGenerated } from "../../summarization/index.js";
import type { CatalogDayView, CatalogEntryView, CatalogReadModel } from "../application/queries.js";
import { catalogEntries } from "./schema.js";

type CatalogRow = typeof catalogEntries.$inferSelect;

/**
 * Proyección persistente: escucha los eventos de los demás módulos y
 * mantiene la tabla que sirve la API. Sobrevive a los reinicios, que es
 * justo lo que le faltaba a la versión en memoria.
 *
 * Sigue sin consultar las tablas de nadie: todo lo que guarda le llega en
 * el payload de los eventos.
 */
export class PostgresCatalogProjection implements CatalogReadModel {
  constructor(
    private readonly db: Database,
    private readonly logger: Logger,
  ) {}

  /**
   * IMPORTANTE: hay que suscribir esta proyección ANTES que los módulos que
   * publican eventos derivados. `SummarizeEntry` emite `summary-generated`
   * desde dentro de su handler de `entry-ingested`, así que si el catálogo
   * se suscribiera después, el resumen llegaría antes de que exista la fila
   * que hay que actualizar y se perdería. La composición lo garantiza.
   */
  register(eventBus: EventBus): void {
    eventBus.subscribe<EntryIngested>("ingestion.entry-ingested", async (event) => {
      const p = event.payload;
      const values = {
        id: p.entryId,
        publicationDate: p.publicationDate,
        department: p.department,
        title: p.title,
        officialHtmlUrl: p.officialHtmlUrl,
        officialPdfUrl: p.officialPdfUrl,
        lastOfficialUpdateAt: p.lastOfficialUpdateAt,
      };

      // Reingerir un día no debe borrar el resumen ya proyectado, así que
      // el UPSERT solo toca los campos que trae este evento.
      await this.db
        .insert(catalogEntries)
        .values(values)
        .onConflictDoUpdate({
          target: catalogEntries.id,
          set: { ...values, updatedAt: new Date() },
        });
    });

    eventBus.subscribe<SummaryGenerated>("summarization.summary-generated", async (event) => {
      const p = event.payload;
      const updated = await this.db
        .update(catalogEntries)
        .set({
          plainTitle: p.plainTitle,
          shortPhrase: p.shortPhrase,
          bulletPoints: [...p.bulletPoints],
          impact: p.impact,
          model: p.model,
          updatedAt: new Date(),
        })
        .where(eq(catalogEntries.id, p.entryId))
        .returning({ id: catalogEntries.id });

      // Un resumen para una fila inexistente significa que el orden de
      // suscripción se ha roto: se perdería en silencio y la web mostraría
      // la disposición sin resumen para siempre.
      if (updated.length === 0) {
        this.logger.error(
          { entryId: p.entryId },
          "Resumen recibido para una disposición que no está en el catálogo",
        );
      }
    });
  }

  async listDays(limit: number): Promise<CatalogDayView[]> {
    // Dos consultas en lugar de traerlo todo y agrupar en memoria: primero
    // los N días más recientes, después sus disposiciones.
    const days = await this.db
      .selectDistinct({ date: catalogEntries.publicationDate })
      .from(catalogEntries)
      .orderBy(desc(catalogEntries.publicationDate))
      .limit(limit);

    if (days.length === 0) return [];

    const dates = days.map((day) => day.date);
    const rows = await this.db
      .select()
      .from(catalogEntries)
      .where(inArray(catalogEntries.publicationDate, dates))
      .orderBy(desc(catalogEntries.publicationDate), catalogEntries.id);

    return dates.map((date) => ({
      date: toIsoDate(date),
      entries: rows.filter((row) => row.publicationDate === date).map(toView),
    }));
  }

  async getDay(date: IsoDate): Promise<CatalogDayView | null> {
    const rows = await this.db
      .select()
      .from(catalogEntries)
      .where(eq(catalogEntries.publicationDate, date))
      .orderBy(catalogEntries.id);

    return rows.length > 0 ? { date, entries: rows.map(toView) } : null;
  }

  async getEntry(id: string): Promise<CatalogEntryView | null> {
    const rows = await this.db
      .select()
      .from(catalogEntries)
      .where(eq(catalogEntries.id, id))
      .limit(1);

    const row = rows[0];
    return row ? toView(row) : null;
  }

  /**
   * Reconstruye la proyección desde cero. Al ser datos derivados, se puede
   * tirar y regenerar; lo necesita la Fase 3 para reproyectar tras cambiar
   * la forma de la vista.
   */
  async clear(): Promise<void> {
    await this.db.execute(sql`truncate table ${catalogEntries}`);
  }
}

function toView(row: CatalogRow): CatalogEntryView {
  return {
    id: row.id,
    publicationDate: toIsoDate(row.publicationDate),
    department: row.department,
    title: row.title,
    plainTitle: row.plainTitle,
    officialHtmlUrl: row.officialHtmlUrl,
    officialPdfUrl: row.officialPdfUrl,
    shortPhrase: row.shortPhrase,
    bulletPoints: row.bulletPoints,
    impact: row.impact,
    model: row.model,
    lastOfficialUpdateAt: toIsoDate(row.lastOfficialUpdateAt),
  };
}

function toIsoDate(raw: string): IsoDate {
  const parsed = isoDate(raw);
  if (!parsed.ok) throw new Error(`Fila corrupta en catalog.entries: ${parsed.error.message}`);
  return parsed.value;
}
