import type {
  NotificationLogEntry,
  NotificationLogRepository,
} from "../domain/notification-log.js";

/** Solo para tests; en producción se usa `PostgresNotificationLog`. */
export class InMemoryNotificationLog implements NotificationLogRepository {
  private readonly sent = new Map<string, NotificationLogEntry>();

  async record(entry: NotificationLogEntry): Promise<void> {
    if (entry.success) {
      this.sent.set(`${entry.entryId}:${entry.channel}`, entry);
    }
  }

  async wasSent(entryId: string, channel: string): Promise<boolean> {
    return this.sent.has(`${entryId}:${channel}`);
  }
}
