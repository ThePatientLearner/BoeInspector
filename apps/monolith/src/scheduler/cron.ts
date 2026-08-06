import cron from "node-cron";
import { todayIn } from "../shared/domain/iso-date.js";
import type { Logger } from "../shared/logger/logger.js";
import type { IngestDailyBulletin } from "../modules/ingestion/index.js";

/**
 * Dispara la ingesta según CRON_SCHEDULE (por defecto 08:30 L-S,
 * Europe/Madrid). Gracias a la idempotencia del caso de uso, se puede
 * añadir un reintento a media mañana sin miedo a duplicar nada.
 *
 * TODO(fase 5): reintentos a las 10:00/12:00 si a las 08:30 aún no había
 * sumario, y alerta si la ingesta falla dos días seguidos.
 */
export function startScheduler(
  ingest: IngestDailyBulletin,
  schedule: string,
  timeZone: string,
  logger: Logger,
): void {
  cron.schedule(
    schedule,
    async () => {
      const date = todayIn(timeZone);
      logger.info({ date }, "Cron: arrancando ingesta diaria");
      const result = await ingest.execute(date);
      if (!result.ok) {
        logger.error({ date, error: result.error.message }, "Cron: la ingesta falló");
      }
    },
    { timezone: timeZone },
  );
  logger.info({ schedule, timeZone }, "Scheduler iniciado");
}
