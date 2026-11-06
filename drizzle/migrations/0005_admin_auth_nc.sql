CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"actor_name" varchar(255),
	"action" varchar(60) NOT NULL,
	"entity" varchar(40) NOT NULL,
	"entity_id" varchar(40),
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"cnpj" varchar(20),
	"contact_name" varchar(180),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "nc_acoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nc_id" integer NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"o_que" text NOT NULL,
	"por_que" text NOT NULL,
	"onde" text,
	"quem" varchar(255) NOT NULL,
	"quando" varchar(20) NOT NULL,
	"como" text NOT NULL,
	"quanto" varchar(100),
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"concluida_em" timestamp,
	"evidencia" text,
	"evidencia_foto_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nc_eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nc_id" integer NOT NULL,
	"tipo" varchar(40) NOT NULL,
	"descricao" text NOT NULL,
	"autor" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nao_conformidades" ALTER COLUMN "status" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "nao_conformidades" ALTER COLUMN "status" SET DEFAULT 'aberta';--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "criado_por" varchar(255);--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "acao_imediata" text;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "causa_metodo" varchar(30);--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "porques" text;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "causa_raiz" text;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "prazo_original" varchar(20);--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "verificacao_resultado" varchar(20);--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "verificacao_obs" text;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "verificado_por" varchar(255);--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "verificado_em" timestamp;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "encerrada_em" timestamp;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "cancelada_motivo" text;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "lembrete_prazo_em" timestamp;--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "lembrete_vencida_em" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_company_id" integer;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "access_level" varchar(20) DEFAULT 'usuario' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nc_acoes" ADD CONSTRAINT "nc_acoes_nc_id_nao_conformidades_id_fk" FOREIGN KEY ("nc_id") REFERENCES "public"."nao_conformidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nc_eventos" ADD CONSTRAINT "nc_eventos_nc_id_nao_conformidades_id_fk" FOREIGN KEY ("nc_id") REFERENCES "public"."nao_conformidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_company_id_client_companies_id_fk" FOREIGN KEY ("client_company_id") REFERENCES "public"."client_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Dados iniciais: empresas clientes, vínculo das obras existentes e o administrador principal.
INSERT INTO "client_companies" ("name") VALUES
	('PETMAX'), ('Hotel Marina'), ('Grupo CTV'), ('Tetris'), ('SUM Engenharia'),
	('LSMG'), ('Origem ATTO'), ('ENGEPAR'), ('ECO Solution')
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
UPDATE "projects" SET "client_company_id" = (SELECT "id" FROM "client_companies" WHERE "name" = 'Hotel Marina')
WHERE "name" ILIKE 'Hotel Marina%' AND "client_company_id" IS NULL;--> statement-breakpoint
UPDATE "projects" SET "client_company_id" = (SELECT "id" FROM "client_companies" WHERE "name" = 'LSMG')
WHERE ("name" ILIKE 'LMSG%' OR "name" ILIKE 'LSMG%') AND "client_company_id" IS NULL;--> statement-breakpoint
UPDATE "user_profiles" SET "access_level" = 'admin' WHERE lower("email") = 'fvellososms@gmail.com';
