import { date, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Cada módulo tiene su propio schema de Postgres: un módulo no lee las
 * tablas de otro. Si algún día se separa en servicios, la frontera de
 * datos ya está dibujada.
 */
export const ingestionSchema = pgSchema("ingestion");

export const entries = ingestionSchema.table("entries", {
  id: text("id").primaryKey(), // BOE-A-2026-XXXXX — clave natural
  publicationDate: date("publication_date").notNull(),
  section: text("section").notNull(),
  department: text("department").notNull(),
  title: text("title").notNull(),
  officialHtmlUrl: text("official_html_url").notNull(),
  officialPdfUrl: text("official_pdf_url").notNull(),
  officialXmlUrl: text("official_xml_url"),
  rawText: text("raw_text"),
  status: text("status", { enum: ["pending", "summarized", "notified", "failed"] })
    .notNull()
    .default("pending"),
  // Obligatorio por las condiciones de reutilización del BOE (LEGAL.md)
  lastOfficialUpdateAt: date("last_official_update_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
