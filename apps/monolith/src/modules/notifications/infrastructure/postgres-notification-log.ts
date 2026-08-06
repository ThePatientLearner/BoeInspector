import { and, eq } from "drizzle-orm";
import type { Database } from "../../../shared/db/connection.js";
import type {
  NotificationLogEntry,
  NotificationLogRepository,
} from "../domain/notification-log.js";
import { notificationLog } from "./schema.js";

/**
 * Registro de envíos en el schema `notifications`. Es lo que hace que un
 * reintento no vuelva a publicar en un canal que ya recibió la disposición.
 *
 * A diferencia del adapter en memoria, aquí se anotan también los intentos
 * fallidos: sirven para diagnosticar un canal caído. `wasSent` solo mira
 * los envíos con éxito, así que un fallo se reintenta en la pasada siguiente.
 */
export class PostgresNotificationLog implements NotificationLogRepository {
  constructor(private readonly db: Database) {}

  async record(entry: NotificationLogEntry): Promise<void> {
    await this.db
      .insert(notificationLog)
      .values({
        entryId: entry.entryId,
        channel: entry.channel,
        sentAt: entry.sentAt,
        success: entry.success,
      })
      .onConflictDoUpdate({
        target: [notificationLog.entryId, notificationLog.channel],
        set: { sentAt: entry.sentAt, success: entry.success },
      });
  }

  async wasSent(entryId: string, channel: string): Promise<boolean> {
    const found = await this.db
      .select({ id: notificationLog.id })
      .from(notificationLog)
      .where(
        and(
          eq(notificationLog.entryId, entryId),
          eq(notificationLog.channel, channel),
          eq(notificationLog.success, true),
        ),
      )
      .limit(1);

    return found.length > 0;
  }
}
