/** API pública del módulo `notifications`. */
export { NotifyEntry } from "./application/notify-entry.js";
export type { NotificationMessage, Notifier } from "./domain/notifier.js";
export type {
  NotificationLogEntry,
  NotificationLogRepository,
} from "./domain/notification-log.js";
export { entryNotified, type EntryNotified } from "./domain/events.js";
export { TelegramNotifier } from "./infrastructure/telegram-notifier.js";
export { DiscordNotifier } from "./infrastructure/discord-notifier.js";
export { ConsoleNotifier } from "./infrastructure/console-notifier.js";
export { InMemoryNotificationLog } from "./infrastructure/in-memory-notification-log.js";
export { PostgresNotificationLog } from "./infrastructure/postgres-notification-log.js";
