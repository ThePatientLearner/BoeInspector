/**
 * Evento de dominio: el único mecanismo de comunicación entre módulos.
 * El nombre lleva el prefijo del módulo emisor ("ingestion.entry-ingested").
 *
 * Los payloads se denormalizan a propósito: un módulo consumidor no debe
 * volver a la base de datos de otro módulo a por los datos que le faltan.
 */
export interface DomainEvent<TName extends string = string, TPayload = unknown> {
  readonly name: TName;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}
