export interface Summary {
  readonly entryId: string;
  /** Frase corta para notificaciones (≤ 200 caracteres). */
  readonly shortPhrase: string;
  /** 5–8 puntos con lo esencial de la disposición. */
  readonly bulletPoints: readonly string[];
  /** Modelo que generó el resumen — se muestra en la web (transparencia IA). */
  readonly model: string;
  readonly generatedAt: Date;
}
