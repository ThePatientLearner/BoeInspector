import type { BoeId } from "../../../shared/domain/boe-id.js";
import type { IsoDate } from "../../../shared/domain/iso-date.js";

/**
 * Ciclo de vida de una disposición dentro del sistema.
 * Las transiciones de estado son las que hacen idempotente el pipeline:
 * re-ejecutar el cron nunca re-resume ni re-notifica.
 */
export type EntryStatus = "pending" | "summarized" | "notified" | "failed";

export interface BoeEntryProps {
  readonly id: BoeId;
  readonly publicationDate: IsoDate;
  readonly section: string;
  readonly department: string;
  readonly title: string;
  readonly officialHtmlUrl: string;
  readonly officialPdfUrl: string;
  readonly officialXmlUrl: string | null;
  readonly rawText: string | null;
  readonly status: EntryStatus;
  /**
   * Fecha de última actualización del documento oficial. Obligatoria por
   * las condiciones de reutilización del BOE (ver LEGAL.md) — no es un extra.
   */
  readonly lastOfficialUpdateAt: IsoDate;
}

export class BoeEntry {
  private constructor(private props: BoeEntryProps) {}

  static ingest(props: Omit<BoeEntryProps, "status">): BoeEntry {
    return new BoeEntry({ ...props, status: "pending" });
  }

  static restore(props: BoeEntryProps): BoeEntry {
    return new BoeEntry(props);
  }

  get id(): BoeId {
    return this.props.id;
  }

  get status(): EntryStatus {
    return this.props.status;
  }

  get title(): string {
    return this.props.title;
  }

  get publicationDate(): IsoDate {
    return this.props.publicationDate;
  }

  get rawText(): string | null {
    return this.props.rawText;
  }

  toProps(): BoeEntryProps {
    return { ...this.props };
  }

  markSummarized(): void {
    this.transition("pending", "summarized");
  }

  markNotified(): void {
    this.transition("summarized", "notified");
  }

  markFailed(): void {
    this.props = { ...this.props, status: "failed" };
  }

  private transition(from: EntryStatus, to: EntryStatus): void {
    if (this.props.status !== from) {
      throw new Error(
        `Transición inválida en ${this.props.id.value}: ${this.props.status} → ${to}`,
      );
    }
    this.props = { ...this.props, status: to };
  }
}
