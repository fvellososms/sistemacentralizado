CREATE TYPE "public"."apr_status" AS ENUM('rascunho', 'aguardando_aprovacao', 'aprovada', 'reprovada');--> statement-breakpoint
CREATE TYPE "public"."origem_item" AS ENUM('base', 'manual');--> statement-breakpoint
CREATE TYPE "public"."perfil_usuario" AS ENUM('colaborador', 'admin_sst', 'aprovador');--> statement-breakpoint
CREATE TYPE "public"."tipo_controle" AS ENUM('eliminacao', 'substituicao', 'engenharia', 'administrativo', 'epi');--> statement-breakpoint
CREATE TABLE "apr" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"obra_id" integer,
	"local_obra" text NOT NULL,
	"responsavel" text NOT NULL,
	"equipe" text,
	"data_execucao" date,
	"descricao_servico" text NOT NULL,
	"status" "apr_status" DEFAULT 'rascunho' NOT NULL,
	"etapa_atual" integer DEFAULT 1 NOT NULL,
	"revisada_pelo_autor" boolean DEFAULT false NOT NULL,
	"criado_por" integer,
	"aprovado_por" integer,
	"motivo_reprovacao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"submetido_em" timestamp with time zone,
	"aprovado_em" timestamp with time zone,
	CONSTRAINT "apr_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "apr_atividade" (
	"id" serial PRIMARY KEY NOT NULL,
	"apr_id" integer NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"atividade_nome_snapshot" text NOT NULL,
	"atividade_categoria_snapshot" text,
	"atividade_origem_id" integer,
	"origem" "origem_item" DEFAULT 'base' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apr_controle" (
	"id" serial PRIMARY KEY NOT NULL,
	"apr_risco_id" integer NOT NULL,
	"controle_nome_snapshot" text NOT NULL,
	"tipo_controle_snapshot" "tipo_controle" NOT NULL,
	"obrigatorio" boolean DEFAULT false NOT NULL,
	"selecionado" boolean DEFAULT true NOT NULL,
	"justificativa" text,
	"controle_origem_id" integer,
	"origem" "origem_item" DEFAULT 'base' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apr_risco" (
	"id" serial PRIMARY KEY NOT NULL,
	"apr_atividade_id" integer NOT NULL,
	"risco_nome_snapshot" text NOT NULL,
	"nrs_snapshot" text,
	"probabilidade" text DEFAULT 'media' NOT NULL,
	"severidade" text DEFAULT 'moderada' NOT NULL,
	"revisado" boolean DEFAULT false NOT NULL,
	"risco_origem_id" integer,
	"origem" "origem_item" DEFAULT 'base' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atividade_risco" (
	"id" serial PRIMARY KEY NOT NULL,
	"atividade_id" integer NOT NULL,
	"risco_id" integer NOT NULL,
	"probabilidade" text DEFAULT 'media' NOT NULL,
	"severidade" text DEFAULT 'moderada' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atividade_termos" (
	"id" serial PRIMARY KEY NOT NULL,
	"atividade_id" integer NOT NULL,
	"termo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atividades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"categoria" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "busca_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"texto_busca" text NOT NULL,
	"melhor_score" real DEFAULT 0 NOT NULL,
	"satisfatoria" boolean DEFAULT false NOT NULL,
	"revisada" boolean DEFAULT false NOT NULL,
	"usuario_id" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medidas_controle" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"tipo_controle" "tipo_controle" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nrs" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"descricao" text NOT NULL,
	CONSTRAINT "nrs_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "obras" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"endereco" text,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "obras_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"company_name" varchar(255) DEFAULT 'Construtora Aliança S/A' NOT NULL,
	"address" text NOT NULL,
	"manager_name" varchar(255) DEFAULT 'Eng. Roberto Albuquerque' NOT NULL,
	"status" varchar(50) DEFAULT 'Em andamento' NOT NULL,
	"start_date" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rdo_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"rdo_id" integer NOT NULL,
	"description" text NOT NULL,
	"location" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'em_andamento' NOT NULL,
	"has_overtime" boolean DEFAULT false NOT NULL,
	"overtime_hours" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "rdo_contractors" (
	"id" serial PRIMARY KEY NOT NULL,
	"rdo_id" integer NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"trade" varchar(255) NOT NULL,
	"worker_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rdo_non_conformities" (
	"id" serial PRIMARY KEY NOT NULL,
	"rdo_id" integer NOT NULL,
	"description" text NOT NULL,
	"nr" varchar(100),
	"severity" varchar(50) DEFAULT 'media' NOT NULL,
	"corrective_action" text,
	"status" varchar(50) DEFAULT 'resolvido' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rdo_occurrences" (
	"id" serial PRIMARY KEY NOT NULL,
	"rdo_id" integer NOT NULL,
	"order_index" integer DEFAULT 1 NOT NULL,
	"category" varchar(100) DEFAULT 'Geral' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"impacted_hours" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "rdo_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"rdo_id" integer NOT NULL,
	"activity_name" varchar(255) NOT NULL,
	"non_conformity_text" varchar(255),
	"good_practice_text" varchar(255),
	"caption" text,
	"photo_url" text NOT NULL,
	"timestamp" varchar(100),
	"location_text" varchar(255),
	"show_watermark" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rdos" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"rdo_number" integer NOT NULL,
	"date" varchar(20) NOT NULL,
	"day_of_week" varchar(20),
	"day_status" varchar(50) DEFAULT 'trabalhando' NOT NULL,
	"work_condition" varchar(50) DEFAULT 'praticavel' NOT NULL,
	"weather_morning" varchar(50) DEFAULT 'sol' NOT NULL,
	"weather_afternoon" varchar(50) DEFAULT 'sol' NOT NULL,
	"own_team_count" integer DEFAULT 0 NOT NULL,
	"contractor_team_count" integer DEFAULT 0 NOT NULL,
	"total_headcount" integer DEFAULT 0 NOT NULL,
	"total_hh" numeric(10, 2) DEFAULT '0' NOT NULL,
	"has_occurrences" boolean DEFAULT false NOT NULL,
	"observations" text,
	"author_name" varchar(255) DEFAULT 'Carlos E. Silva' NOT NULL,
	"status" varchar(50) DEFAULT 'concluido' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risco_controle" (
	"id" serial PRIMARY KEY NOT NULL,
	"risco_id" integer NOT NULL,
	"controle_id" integer NOT NULL,
	"obrigatorio" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risco_nr" (
	"id" serial PRIMARY KEY NOT NULL,
	"risco_id" integer NOT NULL,
	"nr_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riscos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(255) DEFAULT 'Encarregado Geral de Obra' NOT NULL,
	"cpf" varchar(50),
	"phone" varchar(50),
	"birth_date" varchar(50),
	"address" text,
	"department" varchar(255) DEFAULT 'Engenharia & Produção' NOT NULL,
	"avatar_url" text,
	"password_hash" varchar(255) DEFAULT '123456',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text,
	"cargo" text,
	"perfil" "perfil_usuario" DEFAULT 'colaborador' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "apr" ADD CONSTRAINT "apr_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr" ADD CONSTRAINT "apr_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr" ADD CONSTRAINT "apr_aprovado_por_usuarios_id_fk" FOREIGN KEY ("aprovado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr_atividade" ADD CONSTRAINT "apr_atividade_apr_id_apr_id_fk" FOREIGN KEY ("apr_id") REFERENCES "public"."apr"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr_atividade" ADD CONSTRAINT "apr_atividade_atividade_origem_id_atividades_id_fk" FOREIGN KEY ("atividade_origem_id") REFERENCES "public"."atividades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr_controle" ADD CONSTRAINT "apr_controle_apr_risco_id_apr_risco_id_fk" FOREIGN KEY ("apr_risco_id") REFERENCES "public"."apr_risco"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr_controle" ADD CONSTRAINT "apr_controle_controle_origem_id_medidas_controle_id_fk" FOREIGN KEY ("controle_origem_id") REFERENCES "public"."medidas_controle"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr_risco" ADD CONSTRAINT "apr_risco_apr_atividade_id_apr_atividade_id_fk" FOREIGN KEY ("apr_atividade_id") REFERENCES "public"."apr_atividade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apr_risco" ADD CONSTRAINT "apr_risco_risco_origem_id_riscos_id_fk" FOREIGN KEY ("risco_origem_id") REFERENCES "public"."riscos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividade_risco" ADD CONSTRAINT "atividade_risco_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividade_risco" ADD CONSTRAINT "atividade_risco_risco_id_riscos_id_fk" FOREIGN KEY ("risco_id") REFERENCES "public"."riscos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividade_termos" ADD CONSTRAINT "atividade_termos_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "busca_log" ADD CONSTRAINT "busca_log_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rdo_activities" ADD CONSTRAINT "rdo_activities_rdo_id_rdos_id_fk" FOREIGN KEY ("rdo_id") REFERENCES "public"."rdos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rdo_contractors" ADD CONSTRAINT "rdo_contractors_rdo_id_rdos_id_fk" FOREIGN KEY ("rdo_id") REFERENCES "public"."rdos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rdo_non_conformities" ADD CONSTRAINT "rdo_non_conformities_rdo_id_rdos_id_fk" FOREIGN KEY ("rdo_id") REFERENCES "public"."rdos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rdo_occurrences" ADD CONSTRAINT "rdo_occurrences_rdo_id_rdos_id_fk" FOREIGN KEY ("rdo_id") REFERENCES "public"."rdos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rdo_photos" ADD CONSTRAINT "rdo_photos_rdo_id_rdos_id_fk" FOREIGN KEY ("rdo_id") REFERENCES "public"."rdos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rdos" ADD CONSTRAINT "rdos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risco_controle" ADD CONSTRAINT "risco_controle_risco_id_riscos_id_fk" FOREIGN KEY ("risco_id") REFERENCES "public"."riscos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risco_controle" ADD CONSTRAINT "risco_controle_controle_id_medidas_controle_id_fk" FOREIGN KEY ("controle_id") REFERENCES "public"."medidas_controle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risco_nr" ADD CONSTRAINT "risco_nr_risco_id_riscos_id_fk" FOREIGN KEY ("risco_id") REFERENCES "public"."riscos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risco_nr" ADD CONSTRAINT "risco_nr_nr_id_nrs_id_fk" FOREIGN KEY ("nr_id") REFERENCES "public"."nrs"("id") ON DELETE cascade ON UPDATE no action;