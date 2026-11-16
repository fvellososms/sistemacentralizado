CREATE TABLE "workspace_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"date" varchar(10) NOT NULL,
	"time" varchar(5),
	"notes" text,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_reminders" ADD CONSTRAINT "workspace_reminders_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_reminders_user_date_idx" ON "workspace_reminders" USING btree ("user_id","date");