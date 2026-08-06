import type { Result } from "../../../shared/domain/result.js";

export interface SummaryDraft {
  readonly shortPhrase: string;
  readonly bulletPoints: readonly string[];
  readonly model: string;
}

/**
 * Puerto hacia la IA. El adapter por defecto habla HTTP contra una API
 * compatible con el formato de OpenAI (MiniMax por defecto, configurable con
 * AI_BASE_URL / AI_MODEL / AI_API_KEY). Cambiar de proveedor —o pasar a un
 * SDK propio— es sustituir el adapter, sin tocar dominio ni casos de uso.
 */
export interface Summarizer {
  summarize(input: { title: string; text: string }): Promise<Result<SummaryDraft>>;
}
