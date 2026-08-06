import { defineConfig } from "vitest/config";

/**
 * Tests de integración: necesitan un Postgres real levantado
 * (`docker compose up -d db`). Van aparte para que `npm test` no dependa
 * de tener infraestructura en marcha.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    // Comparten una misma base de datos: en serie para que no se pisen.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
