/**
 * `npm run ingest`            → último día disponible
 * `npm run ingest -- 2026-07-23` → una fecha concreta
 *
 * Fuerza la ingesta diaria completa por el pipeline real (eventos,
 * resúmenes y notificaciones incluidos), sin esperar al cron. Es el mismo
 * código que se ejecuta a las 8:30, así que sirve tanto para probar como
 * para recuperar un día que se haya perdido.
 *
 * Es seguro repetirlo: la ingesta es idempotente y no duplica ni
 * vuelve a notificar lo ya publicado.
 */
import { loadConfig } from "../shared/config/config.js";
import { createLogger } from "../shared/logger/logger.js";
import { createDatabase } from "../shared/db/connection.js";
import { isoDate } from "../shared/domain/iso-date.js";
import { buildApplication } from "../composition.js";
import { BoeApiGateway } from "../modules/ingestion/index.js";
import { findLatestDayWithEntries } from "./find-latest-day.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger();
  const database = createDatabase(config.databaseUrl);

  try {
    const app = buildApplication(config, logger, database.db);

    const argument = process.argv[2];
    let target;

    if (argument) {
      const parsed = isoDate(argument);
      if (!parsed.ok) {
        console.error(`Fecha inválida "${argument}". Formato esperado: yyyy-mm-dd`);
        process.exitCode = 1;
        return;
      }
      target = parsed.value;
    } else {
      const latest = await findLatestDayWithEntries(
        new BoeApiGateway(),
        config.boeSections.split(","),
        config.timeZone,
      );
      if (!latest) {
        console.error("No se ha encontrado ningún boletín reciente con disposiciones.");
        process.exitCode = 1;
        return;
      }
      target = latest.date;
    }

    logger.info({ date: target, channels: app.channels }, "Ingesta manual: empezando");
    const result = await app.ingest.execute(target);

    if (!result.ok) {
      logger.error({ date: target, error: result.error.message }, "Ingesta manual: falló");
      process.exitCode = 1;
      return;
    }
    logger.info({ ...result.value }, "Ingesta manual: terminada");
  } finally {
    // Sin esto el pool mantiene el proceso vivo y el comando no termina.
    await database.close();
  }
}

main().catch((error) => {
  console.error("Fallo inesperado:", error);
  process.exit(1);
});
