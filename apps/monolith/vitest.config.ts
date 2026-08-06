import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Los tests unitarios no tocan nada externo: `npm test` sigue siendo
    // instantáneo y funciona sin Postgres ni red.
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts", "node_modules/**"],
  },
});
