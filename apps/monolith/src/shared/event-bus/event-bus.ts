import type { DomainEvent } from "./domain-event.js";

export type EventHandler<E extends DomainEvent> = (event: E) => Promise<void>;

/**
 * Puerto del bus de eventos. Hoy la implementación es en memoria
 * (mismo proceso); si un día un módulo se extrae a su propio servicio,
 * se sustituye el adapter (Redis, RabbitMQ…) sin tocar dominio ni
 * casos de uso. Esta interfaz es la costura de escalado del monolito.
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<E extends DomainEvent>(name: E["name"], handler: EventHandler<E>): void;
}
