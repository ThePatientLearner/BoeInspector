import { BoeId } from "../../../shared/domain/boe-id.js";
import type { EventBus } from "../../../shared/event-bus/event-bus.js";
import type { Logger } from "../../../shared/logger/logger.js";
import type { EntryNotified } from "../../notifications/index.js";
import type { SummaryGenerated } from "../../summarization/index.js";
import type { EntryStatus } from "../domain/boe-entry.js";
import type { EntryRepository } from "../domain/entry-repository.js";

/**
 * Mantiene al día el estado de cada disposición escuchando lo que hacen
 * los demás módulos: pendiente → resumida → notificada.
 *
 * Sin esto, el ciclo de vida que define el dominio es decorativo: la
 * columna `status` se quedaría en "pendiente" incluso para disposiciones
 * ya publicadas en los canales. Lo necesita la Fase 5 para saber qué hay
 * que reintentar, y hace auditable el pipeline desde la base de datos.
 */
export class TrackEntryProgress {
  constructor(
    private readonly repository: EntryRepository,
    private readonly logger: Logger,
  ) {}

  register(eventBus: EventBus): void {
    eventBus.subscribe<SummaryGenerated>("summarization.summary-generated", (event) =>
      this.advance(event.payload.entryId, "pending", (entry) => entry.markSummarized()),
    );

    eventBus.subscribe<EntryNotified>("notifications.entry-notified", (event) =>
      this.advance(event.payload.entryId, "summarized", (entry) => entry.markNotified()),
    );
  }

  private async advance(
    rawId: string,
    expected: EntryStatus,
    transition: (entry: { markSummarized(): void; markNotified(): void }) => void,
  ): Promise<void> {
    const id = BoeId.create(rawId);
    if (!id.ok) {
      this.logger.warn({ rawId }, "Evento con identificador inválido");
      return;
    }

    const entry = await this.repository.findById(id.value);
    if (!entry) {
      this.logger.warn({ entryId: rawId }, "Evento sobre una disposición desconocida");
      return;
    }

    // Reprocesar un día ya publicado vuelve a emitir los eventos. Comprobar
    // el estado antes de transicionar mantiene la operación idempotente
    // (las transiciones del dominio lanzan si no encajan).
    if (entry.status !== expected) return;

    transition(entry);
    await this.repository.save(entry);
  }
}
