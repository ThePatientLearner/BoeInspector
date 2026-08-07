import type { EventBus } from "../../../shared/event-bus/event-bus.js";
import type { Logger } from "../../../shared/logger/logger.js";
import type { SummaryGenerated } from "../../summarization/index.js";
import { entryNotified } from "../domain/events.js";
import type { NotificationLogRepository } from "../domain/notification-log.js";
import type { Notifier } from "../domain/notifier.js";

/**
 * Reacciona a SummaryGenerated: publica en cada canal registrado y anota
 * el envío. Idempotente por canal: un fallo en Discord no re-publica en
 * Telegram al reintentar.
 *
 * No todo se notifica. Solo las disposiciones que alcanzan el impacto
 * mínimo (NOTIFY_MIN_IMPACT, 3 por defecto) llegan a los canales; el resto
 * se ingiere y se publica en la web, pero sin avisar a nadie. Un cambio en
 * la política interna de un ministerio no merece una notificación en el
 * móvil de mil personas.
 */
export class NotifyEntry {
  constructor(
    private readonly notifiers: readonly Notifier[],
    private readonly log: NotificationLogRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
    private readonly publicWebUrl: string,
    private readonly minImpact: number,
  ) {}

  register(eventBus: EventBus): void {
    eventBus.subscribe<SummaryGenerated>("summarization.summary-generated", (event) =>
      this.handle(event),
    );
  }

  private async handle(event: SummaryGenerated): Promise<void> {
    const { entryId, plainTitle, shortPhrase, impact, officialHtmlUrl } = event.payload;

    if (impact < this.minImpact) {
      this.logger.info(
        { entryId, impact, minImpact: this.minImpact },
        "Impacto por debajo del umbral: se publica en la web pero no se notifica",
      );
      // Se emite igualmente: la fase de notificación ha terminado para esta
      // disposición (con cero envíos, pero terminada). Sin esto, la entrada
      // se quedaría en "summarized" para siempre y parecería atascada.
      await this.eventBus.publish(entryNotified({ entryId, channels: [] }));
      return;
    }

    const message = {
      title: plainTitle,
      shortPhrase,
      impact,
      officialUrl: officialHtmlUrl,
      summaryUrl: `${this.publicWebUrl}/d/${entryId}`,
    };

    let pendingChannels = 0;

    for (const notifier of this.notifiers) {
      if (await this.log.wasSent(entryId, notifier.channel)) {
        continue;
      }
      const result = await notifier.send(message);
      await this.log.record({
        entryId,
        channel: notifier.channel,
        sentAt: new Date(),
        success: result.ok,
      });
      if (!result.ok) {
        pendingChannels += 1;
        this.logger.error(
          { entryId, channel: notifier.channel, error: result.error.message },
          "Fallo notificando",
        );
      }
    }

    // Solo se da por notificada cuando NINGÚN canal quedó pendiente. Si uno
    // falló, no se emite el evento y la entrada conserva su estado anterior,
    // que es lo que permitirá reintentarla.
    if (pendingChannels === 0) {
      await this.eventBus.publish(
        entryNotified({ entryId, channels: this.notifiers.map((n) => n.channel) }),
      );
    }
  }
}
