/** API pública del módulo `catalog`. */
export type {
  CatalogDayView,
  CatalogEntryView,
  CatalogReadModel,
} from "./application/queries.js";
export { InMemoryCatalogProjection } from "./infrastructure/in-memory-catalog-projection.js";
export { PostgresCatalogProjection } from "./infrastructure/postgres-catalog-projection.js";
