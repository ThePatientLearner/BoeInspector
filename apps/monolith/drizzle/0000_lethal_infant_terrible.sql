CREATE SCHEMA "catalog";
--> statement-breakpoint
CREATE SCHEMA "ingestion";
--> statement-breakpoint
CREATE SCHEMA "notifications";
--> statement-breakpoint
CREATE SCHEMA "summarization";
--> statement-breakpoint
CREATE TABLE "catalog"."entries" (
	"id" text PRIMARY KEY NOT NULL,
	"publication_date" date NOT NULL,
	"department" text NOT NULL,
	"title" text NOT NULL,
	"official_html_url" text NOT NULL,
	"official_pdf_url" text NOT NULL,
	"short_phrase" text,
	"bullet_points" jsonb,
	"model" text,
	"last_official_update_at" date NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion"."entries" (
	"id" text PRIMARY KEY NOT NULL,
	"publication_date" date NOT NULL,
	"section" text NOT NULL,
	"department" text NOT NULL,
	"title" text NOT NULL,
	"official_html_url" text NOT NULL,
	"official_pdf_url" text NOT NULL,
	"official_xml_url" text,
	"raw_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_official_update_at" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications"."notification_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"channel" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"success" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summarization"."summaries" (
	"entry_id" text PRIMARY KEY NOT NULL,
	"short_phrase" text NOT NULL,
	"bullet_points" jsonb NOT NULL,
	"model" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "catalog_publication_date_idx" ON "catalog"."entries" USING btree ("publication_date");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_channel_idx" ON "notifications"."notification_log" USING btree ("entry_id","channel");