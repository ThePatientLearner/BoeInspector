import { describe, expect, it, vi } from "vitest";
import type { BoeId } from "../../../shared/domain/boe-id.js";
import { isoDate } from "../../../shared/domain/iso-date.js";
import { err, ok } from "../../../shared/domain/result.js";
import { InMemoryEventBus } from "../../../shared/event-bus/in-memory-event-bus.js";
import type { BoeGateway, BoeSummaryItem } from "../domain/boe-gateway.js";
import type { EntryIngested } from "../domain/events.js";
import { InMemoryEntryRepository } from "../infrastructure/in-memory-entry-repository.js";
import { IngestDailyBulletin } from "./ingest-daily-bulletin.js";

const testLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never;

const item = (id: string, section = "1"): BoeSummaryItem => ({
  id,
  title: `Título de ${id}`,
  section,
  department: "Ministerio de Pruebas",
  htmlUrl: `https://www.boe.es/diario_boe/txt.php?id=${id}`,
  pdfUrl: `https://www.boe.es/boe/dias/pdfs/${id}.pdf`,
  xmlUrl: null,
});

function fakeGateway(items: BoeSummaryItem[] | null): BoeGateway {
  return {
    fetchDailySummary: async () => ok(items),
    fetchEntryContent: async (id: BoeId) =>
      ok({ text: `Texto de ${id.value}`, lastUpdatedAt: date() }),
  };
}

function setup(gateway: BoeGateway) {
  const repository = new InMemoryEntryRepository();
  const bus = new InMemoryEventBus(testLogger);
  const events: EntryIngested[] = [];
  bus.subscribe<EntryIngested>("ingestion.entry-ingested", async (e) => void events.push(e));
  const useCase = new IngestDailyBulletin(gateway, repository, bus, testLogger, ["1"]);
  return { useCase, repository, events };
}

const date = () => {
  const d = isoDate("2026-08-05");
  if (!d.ok) throw d.error;
  return d.value;
};

describe("IngestDailyBulletin", () => {
  it("persiste las disposiciones nuevas de la sección configurada y emite eventos", async () => {
    const { useCase, events } = setup(
      fakeGateway([item("BOE-A-2026-1"), item("BOE-A-2026-2"), item("BOE-B-2026-3", "5")]),
    );

    const report = await useCase.execute(date());

    expect(report.ok).toBe(true);
    if (report.ok) {
      expect(report.value.newEntries).toBe(2); // la sección 5 se filtra
    }
    expect(events.map((e) => e.payload.entryId)).toEqual(["BOE-A-2026-1", "BOE-A-2026-2"]);
  });

  it("es idempotente: re-ejecutar no duplica ni re-emite", async () => {
    const { useCase, events } = setup(fakeGateway([item("BOE-A-2026-1")]));

    await useCase.execute(date());
    const second = await useCase.execute(date());

    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.newEntries).toBe(0);
      expect(second.value.skippedExisting).toBe(1);
    }
    expect(events).toHaveLength(1);
  });

  it("un día sin boletín (404) no es un error", async () => {
    const { useCase } = setup(fakeGateway(null));

    const report = await useCase.execute(date());

    expect(report.ok).toBe(true);
    if (report.ok) {
      expect(report.value.bulletinPublished).toBe(false);
    }
  });

  it("propaga el fallo si el sumario no se puede descargar", async () => {
    const gateway: BoeGateway = {
      fetchDailySummary: async () => err(new Error("BOE caído")),
      fetchEntryContent: async () => ok({ text: "", lastUpdatedAt: date() }),
    };
    const { useCase } = setup(gateway);

    const report = await useCase.execute(date());

    expect(report.ok).toBe(false);
  });
});
