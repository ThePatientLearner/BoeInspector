import { describe, expect, it } from "vitest";
import { BoeId } from "./boe-id.js";

describe("BoeId", () => {
  it("acepta identificadores oficiales válidos", () => {
    const result = BoeId.create("BOE-A-2026-15123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("BOE-A-2026-15123");
    }
  });

  it("normaliza espacios alrededor", () => {
    const result = BoeId.create("  BOE-B-2026-1  ");
    expect(result.ok).toBe(true);
  });

  it.each(["", "BOE-2026-1", "boe-a-2026-1", "BOE-A-26-1", "A-2026-15123"])(
    "rechaza el formato inválido %j",
    (raw) => {
      expect(BoeId.create(raw).ok).toBe(false);
    },
  );
});
