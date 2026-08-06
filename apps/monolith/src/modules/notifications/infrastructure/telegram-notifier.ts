import { err, ok, type Result } from "../../../shared/domain/result.js";
import type { NotificationMessage, Notifier } from "../domain/notifier.js";

/**
 * Publica en un canal de Telegram vía Bot API. El bot debe ser
 * administrador del canal. El pie legal es obligatorio (LEGAL.md §5.3).
 */
export class TelegramNotifier implements Notifier {
  readonly channel = "telegram";

  constructor(
    private readonly botToken: string,
    private readonly channelId: string,
  ) {}

  async send(message: NotificationMessage): Promise<Result<void>> {
    const text = [
      `<b>${escapeHtml(message.title)}</b>`,
      "",
      escapeHtml(message.shortPhrase),
      "",
      `📄 Texto oficial: ${message.officialUrl}`,
      `📝 Resumen completo: ${message.summaryUrl}`,
      "",
      "ℹ️ Resumen generado por IA · Servicio no oficial · Solo el texto del BOE tiene validez legal.",
    ].join("\n");

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: this.channelId, text, parse_mode: "HTML" }),
        },
      );
      if (!response.ok) {
        return err(new Error(`Telegram respondió ${response.status}: ${await response.text()}`));
      }
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
