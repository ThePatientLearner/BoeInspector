import { integer, jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

export const summarizationSchema = pgSchema("summarization");

export const summaries = summarizationSchema.table("summaries", {
  // Referencia lógica a ingestion.entries por id natural; sin FK entre
  // schemas a propósito: la frontera entre módulos también aplica en la BD.
  entryId: text("entry_id").primaryKey(),
  // Título en lenguaje llano; el oficial vive en ingestion.entries.
  plainTitle: text("plain_title").notNull(),
  shortPhrase: text("short_phrase").notNull(),
  bulletPoints: jsonb("bullet_points").$type<string[]>().notNull(),
  // Impacto en el ciudadano, 1-5. La escala está documentada en domain/summary.ts.
  impact: integer("impact").notNull(),
  model: text("model").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});
