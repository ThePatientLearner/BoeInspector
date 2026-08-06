import { describe, expect, it, vi } from "vitest";
import type { DomainEvent } from "./domain-event.js";
import { InMemoryEventBus } from "./in-memory-event-bus.js";

const testLogger = { error: vi.fn() } as never;

type TestEvent = DomainEvent<"test.event", { value: number }>;

const testEvent = (value: number): TestEvent => ({
  name: "test.event",
  occurredAt: new Date(),
  payload: { value },
});

describe("InMemoryEventBus", () => {
  it("entrega el evento a todos los suscriptores", async () => {
    const bus = new InMemoryEventBus(testLogger);
    const received: number[] = [];
    bus.subscribe<TestEvent>("test.event", async (e) => void received.push(e.payload.value));
    bus.subscribe<TestEvent>("test.event", async (e) => void received.push(e.payload.value * 10));

    await bus.publish(testEvent(7));

    expect(received).toEqual([7, 70]);
  });

  it("un handler que falla no bloquea a los demás", async () => {
    const bus = new InMemoryEventBus(testLogger);
    const received: number[] = [];
    bus.subscribe<TestEvent>("test.event", async () => {
      throw new Error("boom");
    });
    bus.subscribe<TestEvent>("test.event", async (e) => void received.push(e.payload.value));

    await bus.publish(testEvent(1));

    expect(received).toEqual([1]);
  });

  it("ignora eventos sin suscriptores", async () => {
    const bus = new InMemoryEventBus(testLogger);
    await expect(bus.publish(testEvent(1))).resolves.toBeUndefined();
  });
});
