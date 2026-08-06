import type { Logger } from "../logger/logger.js";
import type { DomainEvent } from "./domain-event.js";
import type { EventBus, EventHandler } from "./event-bus.js";

/**
 * Bus en memoria: entrega secuencial y aislamiento de errores.
 * Un handler que falla no impide la entrega al resto; el error se
 * registra y el flujo continúa (el estado por entrada permite reintentar).
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler<DomainEvent>[]>();

  constructor(private readonly logger: Logger) {}

  subscribe<E extends DomainEvent>(name: E["name"], handler: EventHandler<E>): void {
    const existing = this.handlers.get(name) ?? [];
    existing.push(handler as EventHandler<DomainEvent>);
    this.handlers.set(name, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.name) ?? [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(
          { event: event.name, error: error instanceof Error ? error.message : String(error) },
          "Fallo en un handler de evento",
        );
      }
    }
  }
}
