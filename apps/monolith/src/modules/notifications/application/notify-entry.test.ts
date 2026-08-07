/**
 * El umbral de impacto es una decisión de producto con consecuencias
 * visibles: si se rompe, o se silencian normas importantes o se molesta a
 * mil personas con trámites internos. Estos tests lo fijan.
 */
import { pino } from "pino";
import { describe, expect, it } from "vitest";

import { ok, type Result } from "../../../shared/domain/result.js";
import { isoDate, type IsoDate } from "../../../shared/domain/iso-date.js";
import { InMemoryEventBus } from "../../../shared/event-bus/in-memory-event-bus.js";
import { summaryGenerated } from "../../summarization/index.js";
import type { EntryNotified } from "../domain/events.js";
import { InMemoryNotificationLog } from "../infrastructure/in-memory-notification-log.js";
import type { NotificationMessage, Notifier } from "../domain/notifier.js";
import { NotifyEntry } from "./notify-entry.js";

const logger = pino({ level: "silent" });

function day(raw: string): IsoDate {
  const parsed = isoDate(raw);
  if (!parsed.ok) throw parsed.error;
  return parsed.value;
}

/** Notificador de prueba que solo guarda lo que le mandan. */
class SpyNotifier implements Notifier {
  readonly channel = "spy";
  readonly sent: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<Result<void>> {
    this.sent.push(message);
    return ok(undefined);
  }
}

function event(impact: number) {
  return summaryGenerated({
    entryId: `BOE-A-2026-0000${impact}`,
    publicationDate: day("2026-08-07"),
    title: "Título oficial larguísimo",
    plainTitle: "Título claro",
    shortPhrase: "Frase corta.",
    bulletPoints: ["Punto"],
    impact: impact as 1 | 2 | 3 | 4 | 5,
    officialHtmlUrl: "https://www.boe.es/…",
    model: "MiniMax-M3",
  });
}

function setup(minImpact: number) {
  const bus = new InMemoryEventBus(logger);
  const notifier = new SpyNotifier();
  const notified: string[] = [];

  new NotifyEntry(
    [notifier],
    new InMemoryNotificationLog(),
    bus,
    logger,
    "https://agenteboe.com",
    minImpact,
  ).register(bus);

  bus.subscribe<EntryNotified>("notifications.entry-notified", async (e) => {
    notified.push(e.payload.entryId);
  });

  return { bus, notifier, notified };
}

describe("NotifyEntry · umbral de impacto", () => {
  it("no notifica por debajo del umbral", async () => {
    const { bus, notifier } = setup(3);

    await bus.publish(event(1));
    await bus.publish(event(2));

    expect(notifier.sent).toHaveLength(0);
  });

  it("notifica a partir del umbral, incluido el valor exacto", async () => {
    const { bus, notifier } = setup(3);

    await bus.publish(event(3));
    await bus.publish(event(4));
    await bus.publish(event(5));

    expect(notifier.sent).toHaveLength(3);
    expect(notifier.sent.map((m) => m.impact)).toEqual([3, 4, 5]);
  });

  it("cierra el ciclo de vida aunque no notifique, para que no quede atascada", async () => {
    const { bus, notified } = setup(3);

    await bus.publish(event(1));

    // Sin esto, la entrada se quedaría en "summarized" para siempre.
    expect(notified).toEqual(["BOE-A-2026-00001"]);
  });

  it("con umbral 1 se notifica absolutamente todo", async () => {
    const { bus, notifier } = setup(1);

    await bus.publish(event(1));
    await bus.publish(event(5));

    expect(notifier.sent).toHaveLength(2);
  });

  it("el mensaje lleva el título llano, no el oficial", async () => {
    const { bus, notifier } = setup(3);

    await bus.publish(event(4));

    expect(notifier.sent[0]?.title).toBe("Título claro");
    expect(notifier.sent[0]?.summaryUrl).toBe("https://agenteboe.com/d/BOE-A-2026-00004");
  });
});
