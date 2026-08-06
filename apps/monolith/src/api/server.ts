import Fastify from "fastify";
import { isoDate } from "../shared/domain/iso-date.js";
import type { Logger } from "../shared/logger/logger.js";
import type { CatalogReadModel } from "../modules/catalog/index.js";

/**
 * API HTTP de solo lectura para el frontend. La API solo habla con
 * `catalog`; nunca con los módulos de escritura.
 */
export function buildServer(catalog: CatalogReadModel, logger: Logger) {
  const app = Fastify({ loggerInstance: logger });

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/days", async () => {
    return catalog.listDays(15);
  });

  app.get<{ Params: { date: string } }>("/api/days/:date", async (request, reply) => {
    const date = isoDate(request.params.date);
    if (!date.ok) {
      return reply.status(400).send({ error: date.error.message });
    }
    const day = await catalog.getDay(date.value);
    if (!day) {
      return reply.status(404).send({ error: "Sin boletín para esa fecha" });
    }
    return day;
  });

  app.get<{ Params: { id: string } }>("/api/entries/:id", async (request, reply) => {
    const entry = await catalog.getEntry(request.params.id);
    if (!entry) {
      return reply.status(404).send({ error: "Disposición no encontrada" });
    }
    return entry;
  });

  return app;
}
