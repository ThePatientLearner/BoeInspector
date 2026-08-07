import type { Result } from "../../../shared/domain/result.js";

export interface NotificationMessage {
  /** Título en lenguaje llano: el oficial no cabe ni se entiende en el móvil. */
  readonly title: string;
  readonly shortPhrase: string;
  /** Impacto en el ciudadano, 1-5; se pinta como ●●●○○. */
  readonly impact: number;
  readonly officialUrl: string;
  readonly summaryUrl: string;
}

/** "●●●○○" — indicador compacto que se ve igual en Telegram y en Discord. */
export function impactDots(impact: number): string {
  const level = Math.min(5, Math.max(1, Math.round(impact)));
  return "●".repeat(level) + "○".repeat(5 - level);
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
