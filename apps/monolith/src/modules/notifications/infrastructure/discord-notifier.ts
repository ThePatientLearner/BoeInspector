import { err, ok, type Result } from "../../../shared/domain/result.js";
import { impactDots, type NotificationMessage, type Notifier } from "../domain/notifier.js";

/** Publica en un canal de Discord vía webhook (no requiere bot). */
export class DiscordNotifier implements Notifier {
  readonly channel = "discord";

  constructor(private readonly webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<Result<void>> {
    const content = [
      `**${message.title}**`,
      `\`${impactDots(message.impact)}\` impacto ${message.impact}/5`,
      "",
      message.shortPhrase,
      "",
      `📄 Texto oficial: <${message.officialUrl}>`,
      `📝 Resumen completo: ${message.summaryUrl}`,
      "",
      "-# ℹ️ Resumen generado por IA · Servicio no oficial · Solo el texto del BOE tiene validez legal.",
    ].join("\n");

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        return err(new Error(`Discord respondió ${response.status}: ${await response.text()}`));
      }
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
