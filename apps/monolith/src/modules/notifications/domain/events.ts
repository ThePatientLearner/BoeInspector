import type { DomainEvent } from "../../../shared/event-bus/domain-event.js";

/**
 * Se emite cuando una disposición ha llegado a TODOS los canales activos.
 * Cierra el ciclo de vida: es lo que permite a `ingestion` marcar la
 * entrada como notificada sin consultar las tablas de este módulo.
 */
export type EntryNotified = DomainEvent<
  "notifications.entry-notified",
  {
    entryId: string;
    channels: readonly string[];
  }
>;

export function entryNotified(payload: EntryNotified["payload"]): EntryNotified {
  return { name: "notifications.entry-notified", occurredAt: new Date(), payload };
}
