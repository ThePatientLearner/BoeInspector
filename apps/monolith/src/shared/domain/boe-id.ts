import { err, ok, type Result } from "./result.js";

/**
 * Identificador oficial de una disposición del BOE, ej. "BOE-A-2026-15123".
 * Es la clave natural de todo el sistema: la idempotencia de la ingesta
 * y de las notificaciones se apoya en él.
 */
const BOE_ID_PATTERN = /^BOE-[A-Z]-\d{4}-\d{1,6}$/;

export class BoeId {
  private constructor(readonly value: string) {}

  static create(raw: string): Result<BoeId> {
    const trimmed = raw.trim();
    if (!BOE_ID_PATTERN.test(trimmed)) {
      return err(new Error(`Identificador BOE inválido: "${raw}"`));
    }
    return ok(new BoeId(trimmed));
  }

  equals(other: BoeId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
