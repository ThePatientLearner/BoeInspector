import { jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

export const summarizationSchema = pgSchema("summarization");

export const summaries = summarizationSchema.table("summaries", {
  // Referencia lógica a ingestion.entries por id natural; sin FK entre
  // schemas a propósito: la frontera entre módulos también aplica en la BD.
  entryId: text("entry_id").primaryKey(),
  shortPhrase: text("short_phrase").notNull(),
  bulletPoints: jsonb("bullet_points").$type<string[]>().notNull(),
  model: text("model").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});
