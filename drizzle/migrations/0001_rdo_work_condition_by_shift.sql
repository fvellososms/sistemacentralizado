ALTER TABLE "rdos" ADD COLUMN "work_condition_morning" varchar(50) DEFAULT 'praticavel' NOT NULL;--> statement-breakpoint
ALTER TABLE "rdos" ADD COLUMN "work_condition_afternoon" varchar(50) DEFAULT 'praticavel' NOT NULL;--> statement-breakpoint
UPDATE "rdos" SET "work_condition_morning" = "work_condition", "work_condition_afternoon" = "work_condition";