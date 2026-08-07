import { date, index, integer, jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Schema del catálogo: la proyección de lectura que sirve la web.
 *
 * Es una tabla desnormalizada a propósito. Duplica datos que ya están en
 * `ingestion` y `summarization`, y eso es exactamente lo que se busca:
 * la API responde con una sola consulta y sin cruzar fronteras de módulo.
 * La fuente de verdad sigue siendo cada módulo; esto es una copia derivada
 * de los eventos y reconstruible.
 */
export const catalogSchema = pgSchema("catalog");

export const catalogEntries = catalogSchema.table(
  "entries",
  {
    id: text("id").primaryKey(),
    publicationDate: date("publication_date").notNull(),
    department: text("department").notNull(),
    title: text("title").notNull(),
    officialHtmlUrl: text("official_html_url").notNull(),
    officialPdfUrl: text("official_pdf_url").notNull(),
    // Nulos mientras la IA no ha resumido todavía: la disposición aparece
    // en la web con su enlace oficial aunque el resumen aún no exista.
    plainTitle: text("plain_title"),
    shortPhrase: text("short_phrase"),
    bulletPoints: jsonb("bullet_points").$type<string[]>(),
    impact: integer("impact"),
    model: text("model"),
    lastOfficialUpdateAt: date("last_official_update_at").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // La portada agrupa por día y ordena por fecha descendente.
    index("catalog_publication_date_idx").on(table.publicationDate),
  ],
);
