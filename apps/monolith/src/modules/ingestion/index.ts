/**
 * API pública del módulo `ingestion`.
 * Nada fuera del módulo importa de sus carpetas internas — la regla la
 * verifica dependency-cruiser en CI.
 */
export { IngestDailyBulletin, type IngestReport } from "./application/ingest-daily-bulletin.js";
export { TrackEntryProgress } from "./application/track-entry-progress.js";
export type { BoeEntryContent, BoeGateway, BoeSummaryItem } from "./domain/boe-gateway.js";
export type { EntryRepository } from "./domain/entry-repository.js";
export { BoeEntry, type EntryStatus } from "./domain/boe-entry.js";
export { entryIngested, type EntryIngested } from "./domain/events.js";
export { BoeApiGateway } from "./infrastructure/boe-api-gateway.js";
export { InMemoryEntryRepository } from "./infrastructure/in-memory-entry-repository.js";
export { PostgresEntryRepository } from "./infrastructure/postgres-entry-repository.js";
