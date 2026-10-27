CREATE TABLE "nao_conformidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"project_name" varchar(255),
	"tipo" varchar(30) NOT NULL,
	"grau" varchar(20) NOT NULL,
	"data_ocorrencia" varchar(20) NOT NULL,
	"local_obra" text NOT NULL,
	"requisito_violado" text NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text NOT NULL,
	"responsavel_nome" varchar(255) NOT NULL,
	"responsavel_email" varchar(255) NOT NULL,
	"prazo" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'aberta' NOT NULL,
	"resolvida_em" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
