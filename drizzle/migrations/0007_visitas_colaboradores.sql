CREATE TABLE "workspace_visit_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_activities" ADD COLUMN "collaborator_id" integer;--> statement-breakpoint
ALTER TABLE "workspace_activities" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "workspace_activities" ADD COLUMN "project_name" varchar(255);--> statement-breakpoint
ALTER TABLE "workspace_activities" ADD COLUMN "visit_type" varchar(30);--> statement-breakpoint
ALTER TABLE "workspace_activities" ADD COLUMN "objective" text;--> statement-breakpoint
ALTER TABLE "workspace_tasks" ADD COLUMN "collaborator_id" integer;--> statement-breakpoint
ALTER TABLE "workspace_visit_photos" ADD CONSTRAINT "workspace_visit_photos_activity_id_workspace_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."workspace_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_visit_photos_activity_idx" ON "workspace_visit_photos" USING btree ("activity_id");--> statement-breakpoint
ALTER TABLE "workspace_activities" ADD CONSTRAINT "workspace_activities_collaborator_id_user_profiles_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_tasks" ADD CONSTRAINT "workspace_tasks_collaborator_id_user_profiles_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- O RD Station deixou de existir: eventuais registros dessa origem passam a ser visitas do próprio sistema.
UPDATE "workspace_activities"
SET "source" = 'visita', "visit_type" = 'tecnica',
    "status" = CASE "status" WHEN 'completed' THEN 'realizada' WHEN 'pending' THEN 'agendada' ELSE 'cancelada' END,
    "external_id" = NULL
WHERE "source" = 'rdstation';
