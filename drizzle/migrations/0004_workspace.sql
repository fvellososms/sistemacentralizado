CREATE TABLE "workspace_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(20) NOT NULL,
	"external_id" varchar(180),
	"occurred_on" varchar(20) NOT NULL,
	"company" varchar(180) NOT NULL,
	"collaborator" varchar(180) NOT NULL,
	"category" varchar(180) NOT NULL,
	"event_code" varchar(20),
	"quantity" integer NOT NULL,
	"submitted_quantity" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"company" varchar(180) NOT NULL,
	"collaborator" varchar(180) NOT NULL,
	"category" varchar(180) DEFAULT 'Outras atividades' NOT NULL,
	"stage" varchar(20) DEFAULT 'todo' NOT NULL,
	"due_date" varchar(20),
	"notes" text,
	"stage_changed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_activities_source_external_id_idx" ON "workspace_activities" USING btree ("source","external_id");