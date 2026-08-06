import { err, ok, type Result } from "./result.js";

/** Fecha de publicación en formato "yyyy-mm-dd". */
export type IsoDate = string & { readonly __brand: "IsoDate" };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isoDate(raw: string): Result<IsoDate> {
  if (!ISO_DATE_PATTERN.test(raw) || Number.isNaN(Date.parse(raw))) {
    return err(new Error(`Fecha inválida (se espera yyyy-mm-dd): "${raw}"`));
  }
  return ok(raw as IsoDate);
}

/** Fecha de hoy en una zona horaria concreta (el BOE vive en Europe/Madrid). */
export function todayIn(timeZone: string): IsoDate {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return formatted as IsoDate;
}
