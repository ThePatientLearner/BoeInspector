import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { Database } from "./connection.js";

/**
 * Aplica las migraciones pendientes. Se ejecuta en el arranque para que
 * `docker compose up` en una máquina nueva deje la base lista sin pasos
 * manuales, y también desde `npm run db:apply`.
 *
 * Drizzle lleva la cuenta de lo aplicado en su propia tabla, así que
 * repetirlo no hace nada. La carpeta se resuelve desde este archivo para
 * que funcione igual ejecutando desde `src/` con tsx que desde `dist/`.
 */
export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../../../drizzle", import.meta.url)),
  });
}
