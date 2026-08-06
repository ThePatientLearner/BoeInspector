export interface NotificationLogEntry {
  readonly entryId: string;
  readonly channel: string;
  readonly sentAt: Date;
  readonly success: boolean;
}

/**
 * Registro de qué se notificó y por dónde. Es lo que hace idempotente el
 * reenvío: un canal que ya recibió una entrada no la vuelve a recibir.
 */
export interface NotificationLogRepository {
  record(entry: NotificationLogEntry): Promise<void>;
  wasSent(entryId: string, channel: string): Promise<boolean>;
}
