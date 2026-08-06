/**
 * Reglas de frontera del monolito modular. Se ejecutan en CI
 * (`npm run check:boundaries`); si fallan, la build falla.
 */
module.exports = {
  forbidden: [
    {
      name: "solo-via-index",
      severity: "error",
      comment:
        "Un módulo solo puede importar de otro módulo a través de su index.ts (API pública)",
      from: { path: "^src/modules/([^/]+)/" },
      to: {
        path: "^src/modules/([^/]+)/.+",
        pathNot: ["^src/modules/$1/", "^src/modules/[^/]+/index\\.ts$"],
      },
    },
    {
      name: "shared-sin-negocio",
      severity: "error",
      comment: "El kernel compartido no conoce los módulos de negocio",
      from: { path: "^src/shared/" },
      to: { path: "^src/modules/" },
    },
    {
      name: "dominio-puro",
      severity: "error",
      comment: "El dominio no depende de application ni de infrastructure",
      from: { path: "^src/modules/[^/]+/domain/" },
      to: { path: "^src/modules/[^/]+/(application|infrastructure)/" },
    },
    {
      name: "application-sin-infra",
      severity: "error",
      comment: "Los casos de uso dependen de puertos, nunca de adapters concretos",
      from: { path: "^src/modules/[^/]+/application/" },
      to: { path: "^src/modules/[^/]+/infrastructure/" },
    },
    {
      name: "api-solo-lectura",
      severity: "error",
      comment: "La API HTTP solo habla con catalog (y shared)",
      from: { path: "^src/api/" },
      to: { path: "^src/modules/(ingestion|summarization|notifications)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // Los tests pueden usar adapters en memoria; las reglas aplican al código de producción
    exclude: { path: "\\.test\\.ts$" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
  },
};
