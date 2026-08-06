import { loadConfig } from "./shared/config/config.js";
import { createLogger } from "./shared/logger/logger.js";
import { createDatabase } from "./shared/db/connection.js";
import { runMigrations } from "./shared/db/migrate.js";
import { buildApplication } from "./composition.js";
import { buildServer } from "./api/server.js";
import { startScheduler } from "./scheduler/cron.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger();

  const database = createDatabase(config.databaseUrl);
  // Antes de aceptar tráfico: si la base no está lista, mejor no arrancar.
  await runMigrations(database.db);
  logger.info("Migraciones al día");

  const app = buildApplication(config, logger, database.db);

  const server = buildServer(app.catalog, logger);
  await server.listen({ port: config.apiPort, host: "0.0.0.0" });
  startScheduler(app.ingest, config.cronSchedule, config.timeZone, logger);

  logger.info(
    { port: config.apiPort, model: config.aiModel, channels: app.channels },
    "BOE Inspector arrancado",
  );

  // Docker manda SIGTERM al parar: cerrar el servidor y el pool antes de
  // morir evita conexiones colgadas en Postgres.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Apagando");
    await server.close();
    await database.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Fallo en el arranque:", error);
  process.exit(1);
});
