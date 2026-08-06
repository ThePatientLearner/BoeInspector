import { boolean, pgSchema, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const notificationsSchema = pgSchema("notifications");

export const notificationLog = notificationsSchema.table(
  "notification_log",
  {
    id: serial("id").primaryKey(),
    entryId: text("entry_id").notNull(),
    channel: text("channel").notNull(),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    success: boolean("success").notNull(),
  },
  (table) => [uniqueIndex("entry_channel_idx").on(table.entryId, table.channel)],
);
