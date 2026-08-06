import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Conexión a Postgres. Vive en `shared` porque la comparten los cuatro
 * módulos, pero no sabe nada de negocio: cada módulo importa sus propias
 * tablas desde su `schema.ts` y nunca las de otro.
 *
 * El tipo es deliberadamente "sin schema" (`Record<string, never>`): así
 * ningún adapter puede escribir `db.query.<tabla-de-otro-módulo>` — solo
 * puede consultar las tablas que importa explícitamente.
 */
export type Database = PostgresJsDatabase<Record<string, never>>;

export interface DatabaseHandle {
  readonly db: Database;
  /** Cierra el pool. Necesario en la CLI para que el proceso termine. */
  close(): Promise<void>;
}

export function createDatabase(url: string): DatabaseHandle {
  const client = postgres(url, {
    max: 10,
    // Los NOTICE de Postgres (p. ej. "schema already exists") no son errores
    // y ensucian el log del cron.
    onnotice: () => {},
  });

  return {
    db: drizzle(client),
    close: () => client.end({ timeout: 5 }),
  };
}
