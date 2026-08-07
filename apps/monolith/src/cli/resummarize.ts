/**
 * `npm run resummarize -- <fecha|id> [...]`
 *
 * Regenera resúmenes ya existentes y actualiza la web, SIN notificar a los
 * canales. Es la herramienta para cuando cambias el prompt: los resúmenes
 * antiguos se quedan con el formato viejo y volver a lanzar la ingesta no
 * sirve —es idempotente y los da por hechos— pero publicaría de nuevo en
 * Telegram y Discord si algún canal no constaba como enviado.
 *
 *   npm run resummarize -- 2026-08-01          (todo un día)
 *   npm run resummarize -- BOE-A-2026-16758    (una disposición)
 *
 * El truco para no notificar: se monta un bus de eventos donde el ÚNICO
 * suscriptor es la proyección del catálogo. El evento se publica de verdad,
 * la web se entera, y `notifications` ni existe en este proceso.
 */
import { loadConfig } from "../shared/config/config.js";
import { createLogger } from "../shared/logger/logger.js";
import { createDatabase } from "../shared/db/connection.js";
import { BoeId } from "../shared/domain/boe-id.js";
import { isoDate } from "../shared/domain/iso-date.js";
import { InMemoryEventBus } from "../shared/event-bus/in-memory-event-bus.js";
import { PostgresEntryRepository } from "../modules/ingestion/index.js";
import {
  HttpSummarizer,
  PostgresSummaryRepository,
  summaryGenerated,
} from "../modules/summarization/index.js";
import { PostgresCatalogProjection } from "../modules/catalog/index.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Uso: npm run resummarize -- <fecha yyyy-mm-dd | BOE-A-…> [...]");
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const logger = createLogger();
  const { db, close } = createDatabase(config.databaseUrl);

  try {
    const entries = new PostgresEntryRepository(db);
    const summaries = new PostgresSummaryRepository(db);

    // Bus aislado: solo el catálogo escucha. Sin notificadores registrados,
    // publicar el evento no puede alcanzar ningún canal.
    const eventBus = new InMemoryEventBus(logger);
    const catalog = new PostgresCatalogProjection(db, logger);
    catalog.register(eventBus);

    const summarizer = new HttpSummarizer({
      baseUrl: config.aiBaseUrl,
      model: config.aiModel,
      apiKey: config.aiApiKey,
      review: config.aiReview,
    });

    const ids = await resolveIds(args, catalog);
    if (ids.length === 0) {
      console.error("No se ha encontrado ninguna disposición con esos criterios.");
      process.exitCode = 1;
      return;
    }

    console.log(`Regenerando ${ids.length} resumen(es) con ${config.aiModel}.`);
    console.log("Los canales de notificación NO se tocan.\n");

    let done = 0;
    let failed = 0;

    for (const rawId of ids) {
      const id = BoeId.create(rawId);
      if (!id.ok) {
        console.error(`  ✗ ${rawId}: identificador inválido`);
        failed += 1;
        continue;
      }

      const entry = await entries.findById(id.value);
      if (!entry) {
        console.error(`  ✗ ${rawId}: no está en la base de datos`);
        failed += 1;
        continue;
      }

      const props = entry.toProps();
      if (!props.rawText) {
        console.error(`  ✗ ${rawId}: no se guardó el texto oficial, no se puede resumir`);
        failed += 1;
        continue;
      }

      const draft = await summarizer.summarize({ title: props.title, text: props.rawText });
      if (!draft.ok) {
        console.error(`  ✗ ${rawId}: ${draft.error.message}`);
        failed += 1;
        continue;
      }

      await summaries.save({
        entryId: rawId,
        plainTitle: draft.value.plainTitle,
        shortPhrase: draft.value.shortPhrase,
        bulletPoints: draft.value.bulletPoints,
        impact: draft.value.impact,
        model: draft.value.model,
        generatedAt: new Date(),
      });

      await eventBus.publish(
        summaryGenerated({
          entryId: rawId,
          publicationDate: props.publicationDate,
          title: props.title,
          plainTitle: draft.value.plainTitle,
          shortPhrase: draft.value.shortPhrase,
          bulletPoints: draft.value.bulletPoints,
          impact: draft.value.impact,
          officialHtmlUrl: props.officialHtmlUrl,
          model: draft.value.model,
        }),
      );

      console.log(`  ✓ ${rawId}  [impacto ${draft.value.impact}/5]  ${draft.value.plainTitle}`);
      done += 1;
    }

    console.log(`\n${done} regenerado(s), ${failed} fallido(s).`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await close();
  }
}

/** Acepta fechas (expande al día completo) e identificadores sueltos. */
async function resolveIds(
  args: readonly string[],
  catalog: PostgresCatalogProjection,
): Promise<string[]> {
  const ids: string[] = [];

  for (const arg of args) {
    const date = isoDate(arg);
    if (date.ok) {
      const day = await catalog.getDay(date.value);
      if (!day) {
        console.error(`Aviso: sin disposiciones para ${arg}`);
        continue;
      }
      ids.push(...day.entries.map((entry) => entry.id));
    } else {
      ids.push(arg);
    }
  }

  return [...new Set(ids)];
}

main().catch((error) => {
  console.error("Fallo inesperado:", error);
  process.exit(1);
});
