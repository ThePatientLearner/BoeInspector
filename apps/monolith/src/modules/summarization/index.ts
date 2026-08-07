/** API pública del módulo `summarization`. */
export { SummarizeEntry } from "./application/summarize-entry.js";
export type { Summarizer, SummaryDraft } from "./domain/summarizer.js";
export type { ImpactLevel, Summary } from "./domain/summary.js";
export type { SummaryRepository } from "./domain/summary-repository.js";
export { summaryGenerated, type SummaryGenerated } from "./domain/events.js";
export {
  HttpSummarizer,
  type HttpSummarizerOptions,
  type ReviewTrace,
} from "./infrastructure/http-summarizer.js";
export { InMemorySummaryRepository } from "./infrastructure/in-memory-summary-repository.js";
export { PostgresSummaryRepository } from "./infrastructure/postgres-summary-repository.js";
