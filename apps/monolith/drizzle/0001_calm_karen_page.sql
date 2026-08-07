-- Título en lenguaje llano + impacto (1-5) generados por la IA.
--
-- En `catalog` las columnas son nulables por diseño: una disposición aparece
-- en la web en cuanto se ingiere, antes de que exista su resumen.
ALTER TABLE "catalog"."entries" ADD COLUMN "plain_title" text;--> statement-breakpoint
ALTER TABLE "catalog"."entries" ADD COLUMN "impact" integer;--> statement-breakpoint

-- En `summarization` son obligatorias, pero añadirlas como NOT NULL sobre una
-- tabla con filas falla. Se hace en tres pasos: crear nulables, rellenar los
-- resúmenes anteriores y entonces exigir el NOT NULL.
--
-- El relleno es provisional a propósito: esos resúmenes se generaron con el
-- prompt antiguo y no tienen título llano ni impacto reales. Hay que
-- regenerarlos (borrar la fila y re-ejecutar la ingesta del día); mientras
-- tanto quedan marcados de forma reconocible en lugar de inventar un valor
-- que parezca legítimo.
ALTER TABLE "summarization"."summaries" ADD COLUMN "plain_title" text;--> statement-breakpoint
ALTER TABLE "summarization"."summaries" ADD COLUMN "impact" integer;--> statement-breakpoint

UPDATE "summarization"."summaries"
   SET "plain_title" = '(pendiente de regenerar)'
 WHERE "plain_title" IS NULL;--> statement-breakpoint

UPDATE "summarization"."summaries"
   SET "impact" = 3
 WHERE "impact" IS NULL;--> statement-breakpoint

ALTER TABLE "summarization"."summaries" ALTER COLUMN "plain_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "summarization"."summaries" ALTER COLUMN "impact" SET NOT NULL;
