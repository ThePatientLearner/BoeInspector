import { eq } from "drizzle-orm";
import type { Database } from "../../../shared/db/connection.js";
import type { ImpactLevel, Summary } from "../domain/summary.js";
import type { SummaryRepository } from "../domain/summary-repository.js";
import { summaries } from "./schema.js";

/** La columna es un integer cualquiera; el dominio solo admite 1..5. */
function toImpactLevel(value: number, entryId: string): ImpactLevel {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`Impacto fuera de rango en summarization.summaries (${entryId}): ${value}`);
  }
  return value as ImpactLevel;
}

/**
 * Persistencia de resúmenes en el schema `summarization`.
 *
 * El UPSERT permite regenerar un resumen (p. ej. tras mejorar el prompt)
 * sin borrar antes la fila; el caso de uso ya evita llamar a la IA cuando
 * el resumen existe, así que en el flujo normal nunca hay conflicto.
 */
export class PostgresSummaryRepository implements SummaryRepository {
  constructor(private readonly db: Database) {}

  async save(summary: Summary): Promise<void> {
    const values = {
      entryId: summary.entryId,
      plainTitle: summary.plainTitle,
      shortPhrase: summary.shortPhrase,
      // jsonb necesita un array mutable; el dominio lo expone readonly.
      bulletPoints: [...summary.bulletPoints],
      impact: summary.impact,
      model: summary.model,
      generatedAt: summary.generatedAt,
    };

    await this.db
      .insert(summaries)
      .values(values)
      .onConflictDoUpdate({ target: summaries.entryId, set: values });
  }

  async findByEntryId(entryId: string): Promise<Summary | null> {
    const rows = await this.db
      .select()
      .from(summaries)
      .where(eq(summaries.entryId, entryId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      entryId: row.entryId,
      plainTitle: row.plainTitle,
      shortPhrase: row.shortPhrase,
      bulletPoints: row.bulletPoints,
      impact: toImpactLevel(row.impact, row.entryId),
      model: row.model,
      generatedAt: row.generatedAt,
    };
  }
}
