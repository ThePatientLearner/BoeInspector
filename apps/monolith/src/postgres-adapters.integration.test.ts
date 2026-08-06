/**
 * Tests de integración de los adapters de Postgres.
 *
 * Necesitan un Postgres real levantado (`docker compose up -d db`) y se
 * ejecutan con `npm run test:integration`, aparte de los unitarios.
 * Usan su propia base de datos (`..._test`), que se crea sola: nunca tocan
 * los datos reales.
 */
import { sql } from "drizzle-orm";
import { pino } from "pino";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase, type Database, type DatabaseHandle } from "./shared/db/connection.js";
import { runMigrations } from "./shared/db/migrate.js";
import { BoeId } from "./shared/domain/boe-id.js";
import { isoDate, type IsoDate } from "./shared/domain/iso-date.js";
import { InMemoryEventBus } from "./shared/event-bus/in-memory-event-bus.js";
import { BoeEntry, entryIngested, PostgresEntryRepository } from "./modules/ingestion/index.js";
import { PostgresSummaryRepository, summaryGenerated } from "./modules/summarization/index.js";
import { PostgresNotificationLog } from "./modules/notifications/index.js";
import { PostgresCatalogProjection } from "./modules/catalog/index.js";

const logger = pino({ level: "silent" });

const BASE_URL =
  process.env["DATABASE_URL"] ?? "postgres://boe:boe@localhost:5432/boe_inspector";
const TEST_DB = "boe_inspector_test";

function urlForDatabase(name: string): string {
  const url = new URL(BASE_URL);
  url.pathname = `/${name}`;
  return url.toString();
}

/** Crea la base de datos de test si no existe, conectándose a `postgres`. */
async function ensureTestDatabase(): Promise<void> {
  const admin = postgres(urlForDatabase("postgres"), { max: 1, onnotice: () => {} });
  try {
    const existing = await admin`select 1 from pg_database where datname = ${TEST_DB}`;
    if (existing.length === 0) {
      await admin.unsafe(`create database "${TEST_DB}"`);
    }
  } finally {
    await admin.end();
  }
}

let handle: DatabaseHandle;
let db: Database;

beforeAll(async () => {
  await ensureTestDatabase();
  handle = createDatabase(urlForDatabase(TEST_DB));
  db = handle.db;
  await runMigrations(db);
}, 60_000);

afterAll(async () => {
  await handle?.close();
});

beforeEach(async () => {
  await db.execute(
    sql.raw(
      "truncate ingestion.entries, summarization.summaries, notifications.notification_log, catalog.entries restart identity",
    ),
  );
});

// ── Helpers ──────────────────────────────────────────────────────

function id(raw: string): BoeId {
  const parsed = BoeId.create(raw);
  if (!parsed.ok) throw parsed.error;
  return parsed.value;
}

function day(raw: string): IsoDate {
  const parsed = isoDate(raw);
  if (!parsed.ok) throw parsed.error;
  return parsed.value;
}

function anEntry(rawId = "BOE-A-2026-16758"): BoeEntry {
  return BoeEntry.ingest({
    id: id(rawId),
    publicationDate: day("2026-08-01"),
    section: "1",
    department: "COMUNIDAD AUTÓNOMA DE CATALUÑA",
    title: "Resolución ISP/1933/2026, de 15 de junio",
    officialHtmlUrl: `https://www.boe.es/diario_boe/txt.php?id=${rawId}`,
    officialPdfUrl: `https://www.boe.es/boe/dias/2026/08/01/pdfs/${rawId}.pdf`,
    officialXmlUrl: `https://www.boe.es/diario_boe/xml.php?id=${rawId}`,
    rawText: "Texto oficial de la disposición.",
    // Distinta de la fecha de publicación a propósito: es la que exigen las
    // condiciones de reutilización del BOE y la que más fácil se confunde.
    lastOfficialUpdateAt: day("2026-08-04"),
  });
}

// ── ingestion ────────────────────────────────────────────────────

describe("PostgresEntryRepository", () => {
  it("guarda y recupera una disposición sin perder ningún campo", async () => {
    const repository = new PostgresEntryRepository(db);
    await repository.save(anEntry());

    const found = await repository.findById(id("BOE-A-2026-16758"));
    expect(found).not.toBeNull();

    const props = found!.toProps();
    expect(props.id.value).toBe("BOE-A-2026-16758");
    expect(props.section).toBe("1");
    expect(props.rawText).toBe("Texto oficial de la disposición.");
    expect(props.status).toBe("pending");
    expect(props.publicationDate).toBe("2026-08-01");
    expect(props.lastOfficialUpdateAt).toBe("2026-08-04");
  });

  it("no duplica al guardar dos veces la misma clave natural", async () => {
    const repository = new PostgresEntryRepository(db);
    await repository.save(anEntry());
    await repository.save(anEntry());

    expect(await repository.exists(id("BOE-A-2026-16758"))).toBe(true);
    expect(await repository.findByStatus("pending")).toHaveLength(1);
  });

  it("persiste las transiciones de estado", async () => {
    const repository = new PostgresEntryRepository(db);
    const entry = anEntry();
    await repository.save(entry);

    entry.markSummarized();
    await repository.save(entry);
    expect(await repository.findByStatus("summarized")).toHaveLength(1);

    entry.markNotified();
    await repository.save(entry);
    expect(await repository.findByStatus("pending")).toHaveLength(0);
    expect(await repository.findByStatus("notified")).toHaveLength(1);
  });
});

// ── summarization ────────────────────────────────────────────────

describe("PostgresSummaryRepository", () => {
  const summary = {
    entryId: "BOE-A-2026-16758",
    shortPhrase: "Se modifican las restricciones de circulación.",
    bulletPoints: ["Primer punto", "Segundo punto"],
    model: "MiniMax-M3",
    generatedAt: new Date("2026-08-06T10:00:00Z"),
  };

  it("guarda y recupera el resumen con sus puntos", async () => {
    const repository = new PostgresSummaryRepository(db);
    await repository.save(summary);

    const found = await repository.findByEntryId("BOE-A-2026-16758");
    expect(found?.shortPhrase).toBe(summary.shortPhrase);
    expect(found?.bulletPoints).toEqual(["Primer punto", "Segundo punto"]);
    expect(found?.model).toBe("MiniMax-M3");
  });

  it("devuelve null cuando no hay resumen todavía", async () => {
    const repository = new PostgresSummaryRepository(db);
    expect(await repository.findByEntryId("BOE-A-2026-99999")).toBeNull();
  });

  it("sobrescribe al regenerar en lugar de fallar", async () => {
    const repository = new PostgresSummaryRepository(db);
    await repository.save(summary);
    await repository.save({ ...summary, shortPhrase: "Frase corregida." });

    const found = await repository.findByEntryId("BOE-A-2026-16758");
    expect(found?.shortPhrase).toBe("Frase corregida.");
  });
});

// ── notifications ────────────────────────────────────────────────

describe("PostgresNotificationLog", () => {
  it("solo da por enviado lo que tuvo éxito", async () => {
    const log = new PostgresNotificationLog(db);

    await log.record({
      entryId: "BOE-A-2026-16758",
      channel: "telegram",
      sentAt: new Date(),
      success: false,
    });
    expect(await log.wasSent("BOE-A-2026-16758", "telegram")).toBe(false);

    await log.record({
      entryId: "BOE-A-2026-16758",
      channel: "telegram",
      sentAt: new Date(),
      success: true,
    });
    expect(await log.wasSent("BOE-A-2026-16758", "telegram")).toBe(true);
  });

  it("lleva la cuenta por canal, no por disposición", async () => {
    const log = new PostgresNotificationLog(db);
    await log.record({
      entryId: "BOE-A-2026-16758",
      channel: "telegram",
      sentAt: new Date(),
      success: true,
    });

    expect(await log.wasSent("BOE-A-2026-16758", "telegram")).toBe(true);
    expect(await log.wasSent("BOE-A-2026-16758", "discord")).toBe(false);
  });
});

// ── catalog ──────────────────────────────────────────────────────

describe("PostgresCatalogProjection", () => {
  const ingested = entryIngested({
    entryId: "BOE-A-2026-16758",
    publicationDate: day("2026-08-01"),
    department: "COMUNIDAD AUTÓNOMA DE CATALUÑA",
    title: "Resolución ISP/1933/2026",
    officialHtmlUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-16758",
    officialPdfUrl: "https://www.boe.es/boe/dias/2026/08/01/pdfs/BOE-A-2026-16758.pdf",
    text: "Texto oficial.",
    lastOfficialUpdateAt: day("2026-08-04"),
  });

  const summarized = summaryGenerated({
    entryId: "BOE-A-2026-16758",
    publicationDate: day("2026-08-01"),
    title: "Resolución ISP/1933/2026",
    shortPhrase: "Se modifican las restricciones de circulación.",
    bulletPoints: ["Primer punto", "Segundo punto"],
    officialHtmlUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-16758",
    model: "MiniMax-M3",
  });

  function projection(): { catalog: PostgresCatalogProjection; bus: InMemoryEventBus } {
    const bus = new InMemoryEventBus(logger);
    const catalog = new PostgresCatalogProjection(db, logger);
    catalog.register(bus);
    return { catalog, bus };
  }

  it("proyecta la disposición en cuanto se ingiere, aunque no haya resumen", async () => {
    const { catalog, bus } = projection();
    await bus.publish(ingested);

    const view = await catalog.getEntry("BOE-A-2026-16758");
    expect(view?.title).toBe("Resolución ISP/1933/2026");
    expect(view?.shortPhrase).toBeNull();
    // La fecha de actualización oficial viaja en el evento; confundirla con
    // la de publicación incumpliría las condiciones de reutilización.
    expect(view?.lastOfficialUpdateAt).toBe("2026-08-04");
  });

  it("añade el resumen cuando llega", async () => {
    const { catalog, bus } = projection();
    await bus.publish(ingested);
    await bus.publish(summarized);

    const view = await catalog.getEntry("BOE-A-2026-16758");
    expect(view?.shortPhrase).toBe("Se modifican las restricciones de circulación.");
    expect(view?.bulletPoints).toEqual(["Primer punto", "Segundo punto"]);
    expect(view?.model).toBe("MiniMax-M3");
  });

  it("no borra el resumen si se vuelve a ingerir el mismo día", async () => {
    const { catalog, bus } = projection();
    await bus.publish(ingested);
    await bus.publish(summarized);
    await bus.publish(ingested);

    const view = await catalog.getEntry("BOE-A-2026-16758");
    expect(view?.shortPhrase).toBe("Se modifican las restricciones de circulación.");
  });

  it("avisa a gritos si el resumen llega antes que la disposición", async () => {
    // Este es el fallo real que tuvo la primera versión: el bus entrega en
    // orden de suscripción y `SummarizeEntry` publica `summary-generated`
    // dentro de su propio handler, así que si el catálogo se suscribe
    // después, el UPDATE no encuentra fila y el resumen se pierde. Antes
    // ocurría en silencio; ahora tiene que quedar registrado.
    const errors: string[] = [];
    const capturing = pino(
      { level: "error" },
      { write: (line: string) => errors.push(line) },
    );

    const bus = new InMemoryEventBus(capturing);
    const catalog = new PostgresCatalogProjection(db, capturing);
    catalog.register(bus);

    await bus.publish(summarized); // sin el `ingested` previo

    expect(await catalog.getEntry("BOE-A-2026-16758")).toBeNull();
    expect(errors.join("\n")).toContain("no está en el catálogo");
  });

  it("agrupa por día, del más reciente al más antiguo", async () => {
    const { catalog, bus } = projection();
    await bus.publish(ingested);
    await bus.publish({
      ...ingested,
      payload: {
        ...ingested.payload,
        entryId: "BOE-A-2026-16800",
        publicationDate: day("2026-08-03"),
      },
    });

    const days = await catalog.listDays(10);
    expect(days.map((d) => d.date)).toEqual(["2026-08-03", "2026-08-01"]);
    expect(days[0]?.entries).toHaveLength(1);

    const first = await catalog.getDay(day("2026-08-01"));
    expect(first?.entries).toHaveLength(1);
    expect(await catalog.getDay(day("2026-07-01"))).toBeNull();
  });
});
