import type { Result } from "../../../shared/domain/result.js";

export interface NotificationMessage {
  readonly title: string;
  readonly shortPhrase: string;
  readonly officialUrl: string;
  readonly summaryUrl: string;
}

/**
 * Puerto único de notificación: cada canal (Telegram, Discord, WhatsApp
 * en fase 2…) es un adapter. Añadir un canal = añadir una clase, cero
 * cambios en los casos de uso.
 */
export interface Notifier {
  readonly channel: string;
  send(message: NotificationMessage): Promise<Result<void>>;
}
