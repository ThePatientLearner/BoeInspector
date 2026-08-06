/**
 * Composición del monolito: el ÚNICO lugar donde se decide qué adapter
 * implementa cada puerto. Lo usan tanto el arranque normal (`main.ts`)
 * como los comandos de la CLI, para que no puedan desincronizarse.
 *
 * Todo lo que persiste va contra Postgres. Los adapters en memoria siguen
 * existiendo, pero solo para los tests: no hay un modo "sin base de datos"
 * en producción a propósito, porque perder la ingesta en un reinicio sin
 * enterarse es peor que no arrancar.
 */
import type { Config } from "./shared/config/config.js";
import type { Database } from "./shared/db/connection.js";
import type { Logger } from "./shared/logger/logger.js";
import { InMemoryEventBus } from "./shared/event-bus/in-memory-event-bus.js";
import type { EventBus } from "./shared/event-bus/event-bus.js";
import {
  BoeApiGateway,
  IngestDailyBulletin,
  PostgresEntryRepository,
  TrackEntryProgress,
} from "./modules/ingestion/index.js";
import {
  HttpSummarizer,
  PostgresSummaryRepository,
  SummarizeEntry,
} from "./modules/summarization/index.js";
import {
  ConsoleNotifier,
  DiscordNotifier,
  NotifyEntry,
  PostgresNotificationLog,
  TelegramNotifier,
  type Notifier,
} from "./modules/notifications/index.js";
import { PostgresCatalogProjection } from "./modules/catalog/index.js";
import type { CatalogReadModel } from "./modules/catalog/index.js";

export interface Application {
  readonly ingest: IngestDailyBulletin;
  readonly catalog: CatalogReadModel;
  readonly eventBus: EventBus;
  readonly channels: readonly string[];
}

export function buildApplication(config: Config, logger: Logger, db: Database): Application {
  const eventBus = new InMemoryEventBus(logger);

  // ── Catálogo (proyección de lectura para la web) ───────────────
  // Se suscribe EL PRIMERO a propósito. El bus entrega en orden de
  // suscripción y `SummarizeEntry` emite `summary-generated` desde dentro
  // de su handler de `entry-ingested`; si el catálogo fuera después, el
  // resumen llegaría antes de existir la fila y se perdería.
  const catalog = new PostgresCatalogProjection(db, logger);
  catalog.register(eventBus);

  // ── Ingesta ────────────────────────────────────────────────────
  const entries = new PostgresEntryRepository(db);
  const ingest = new IngestDailyBulletin(
    new BoeApiGateway(),
    entries,
    eventBus,
    logger,
    config.boeSections.split(","),
  );
  // Escucha a los demás módulos para llevar el estado de cada disposición
  // (pendiente → resumida → notificada).
  new TrackEntryProgress(entries, logger).register(eventBus);

  // ── Resúmenes ──────────────────────────────────────────────────
  new SummarizeEntry(
    new HttpSummarizer({
      baseUrl: config.aiBaseUrl,
      model: config.aiModel,
      apiKey: config.aiApiKey,
      review: config.aiReview,
      onReview: ({ changed }) => {
        if (changed) logger.info("La pasada de revisión corrigió el resumen");
      },
    }),
    new PostgresSummaryRepository(db),
    eventBus,
    logger,
  ).register(eventBus);

  // ── Notificaciones (cada canal se activa solo si hay credenciales) ─
  const notifiers: Notifier[] = [];
  if (config.telegramBotToken && config.telegramChannel) {
    notifiers.push(new TelegramNotifier(config.telegramBotToken, config.telegramChannel));
  }
  if (config.discordWebhookUrl) {
    notifiers.push(new DiscordNotifier(config.discordWebhookUrl));
  }
  if (notifiers.length === 0) {
    notifiers.push(new ConsoleNotifier(logger));
  }
  new NotifyEntry(
    notifiers,
    new PostgresNotificationLog(db),
    eventBus,
    logger,
    config.publicWebUrl,
  ).register(eventBus);

  return { ingest, catalog, eventBus, channels: notifiers.map((n) => n.channel) };
}
