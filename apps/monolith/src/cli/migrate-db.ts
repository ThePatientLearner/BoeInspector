/**
 * `npm run db:apply`
 *
 * Aplica las migraciones pendientes y sale. El arranque normal ya lo hace
 * solo; este comando existe para preparar una base recién creada o para
 * comprobar el estado tras restaurar una copia de seguridad.
 */
import { loadConfig } from "../shared/config/config.js";
import { createDatabase } from "../shared/db/connection.js";
import { runMigrations } from "../shared/db/migrate.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const database = createDatabase(config.databaseUrl);
  try {
    await runMigrations(database.db);
    console.log("Migraciones aplicadas.");
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error("Fallo aplicando migraciones:", error);
  process.exit(1);
});
