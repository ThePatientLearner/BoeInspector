/**
 * Cuánto afecta una disposición a un ciudadano corriente, del 1 al 5.
 * Lo decide la IA y la web lo muestra como un indicador visual, así que el
 * significado de cada nivel tiene que ser estable: está fijado en el prompt
 * (`http-summarizer.ts`) y no debe cambiarse sin regenerar los resúmenes.
 *
 *   1 · Trámite interno de la Administración, sin efecto práctico.
 *   2 · Afecta a un colectivo pequeño o muy especializado.
 *   3 · Afecta a un colectivo amplio, o cambia precios y trámites.
 *   4 · Obligaciones, plazos o costes relevantes para mucha gente.
 *   5 · Afecta a casi toda la población, o mueve mucho dinero público.
 */
export type ImpactLevel = 1 | 2 | 3 | 4 | 5;

export interface Summary {
  readonly entryId: string;
  /**
   * Título en lenguaje llano, el que se muestra en la portada. El oficial
   * del BOE es exacto pero ilegible ("Resolución ISP/1933/2026, de 15 de
   * junio, de modificación de la Resolución ISP/300/2026…"), así que se
   * enseña dentro, junto al enlace oficial.
   */
  readonly plainTitle: string;
  /** Frase corta para notificaciones (≤ 200 caracteres). */
  readonly shortPhrase: string;
  /** 5–8 puntos con lo esencial de la disposición. */
  readonly bulletPoints: readonly string[];
  readonly impact: ImpactLevel;
  /** Modelo que generó el resumen — se muestra en la web (transparencia IA). */
  readonly model: string;
  readonly generatedAt: Date;
}
