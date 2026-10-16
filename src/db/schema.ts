import { pgTable, serial, text, varchar, integer, boolean, timestamp, numeric, date, real, pgEnum } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull().default("Construtora Aliança S/A"),
  address: text("address").notNull(),
  managerName: varchar("manager_name", { length: 255 }).notNull().default("Eng. Roberto Albuquerque"),
  status: varchar("status", { length: 50 }).notNull().default("Em andamento"),
  startDate: varchar("start_date", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 255 }).notNull().default("Encarregado Geral de Obra"),
  cpf: varchar("cpf", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  birthDate: varchar("birth_date", { length: 50 }),
  address: text("address"),
  department: varchar("department", { length: 255 }).notNull().default("Engenharia & Produção"),
  avatarUrl: text("avatar_url"),
  passwordHash: varchar("password_hash", { length: 255 }).default("123456"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rdos = pgTable("rdos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  rdoNumber: integer("rdo_number").notNull(),
  date: varchar("date", { length: 20 }).notNull(), // YYYY-MM-DD
  dayOfWeek: varchar("day_of_week", { length: 20 }), // qui, sex, etc.
  dayStatus: varchar("day_status", { length: 50 }).notNull().default("trabalhando"), // trabalhando, nao_trabalhando, paralisado_chuva
  workCondition: varchar("work_condition", { length: 50 }).notNull().default("praticavel"), // praticavel, impraticavel
  weatherMorning: varchar("weather_morning", { length: 50 }).notNull().default("sol"), // sol, parcialmente_nublado, nublado, chuva
  weatherAfternoon: varchar("weather_afternoon", { length: 50 }).notNull().default("sol"), // sol, parcialmente_nublado, nublado, chuva
  ownTeamCount: integer("own_team_count").notNull().default(0),
  contractorTeamCount: integer("contractor_team_count").notNull().default(0),
  totalHeadcount: integer("total_headcount").notNull().default(0),
  totalHh: numeric("total_hh", { precision: 10, scale: 2 }).notNull().default("0"),
  hasOccurrences: boolean("has_occurrences").notNull().default(false),
  observations: text("observations"),
  authorName: varchar("author_name", { length: 255 }).notNull().default("Carlos E. Silva"),
  status: varchar("status", { length: 50 }).notNull().default("concluido"), // concluido, rascunho
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rdoContractors = pgTable("rdo_contractors", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  trade: varchar("trade", { length: 255 }).notNull(),
  workerCount: integer("worker_count").notNull().default(1),
});

export const rdoActivities = pgTable("rdo_activities", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("em_andamento"), // em_andamento, concluido
  hasOvertime: boolean("has_overtime").notNull().default(false),
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).default("0"),
});

export const rdoNonConformities = pgTable("rdo_non_conformities", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  nr: varchar("nr", { length: 100 }),
  severity: varchar("severity", { length: 50 }).notNull().default("media"), // baixa, media, alta
  correctiveAction: text("corrective_action"),
  status: varchar("status", { length: 50 }).notNull().default("resolvido"), // resolvido, pendente
});

export const rdoOccurrences = pgTable("rdo_occurrences", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(1),
  category: varchar("category", { length: 100 }).notNull().default("Geral"), // Acidente, Falta de Material, Fiscalização, Entrega, Clima
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  impactedHours: numeric("impacted_hours", { precision: 5, scale: 2 }).default("0"),
});

export const rdoPhotos = pgTable("rdo_photos", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  activityName: varchar("activity_name", { length: 255 }).notNull(),
  nonConformityText: varchar("non_conformity_text", { length: 255 }),
  goodPracticeText: varchar("good_practice_text", { length: 255 }),
  caption: text("caption"),
  photoUrl: text("photo_url").notNull(),
  timestamp: varchar("timestamp", { length: 100 }),
  locationText: varchar("location_text", { length: 255 }),
  showWatermark: boolean("show_watermark").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type RDO = typeof rdos.$inferSelect;
export type RDOContractor = typeof rdoContractors.$inferSelect;
export type RDOActivity = typeof rdoActivities.$inferSelect;
export type RDONonConformity = typeof rdoNonConformities.$inferSelect;
export type RDOOccurrence = typeof rdoOccurrences.$inferSelect;
export type RDOPhoto = typeof rdoPhotos.$inferSelect;
// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const perfilEnum = pgEnum("perfil_usuario", ["colaborador", "admin_sst", "aprovador"]);

export const tipoControleEnum = pgEnum("tipo_controle", [
  "eliminacao",
  "substituicao",
  "engenharia",
  "administrativo",
  "epi",
]);

export const aprStatusEnum = pgEnum("apr_status", [
  "rascunho",
  "aguardando_aprovacao",
  "aprovada",
  "reprovada",
]);

export const origemItemEnum = pgEnum("origem_item", ["base", "manual"]);

// ---------------------------------------------------------------------------
// Usuários e obras
// ---------------------------------------------------------------------------
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash"),
  cargo: text("cargo"),
  perfil: perfilEnum("perfil").notNull().default("colaborador"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const obras = pgTable("obras", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  nome: text("nome").notNull(),
  endereco: text("endereco"),
  ativo: boolean("ativo").notNull().default(true),
});

// ---------------------------------------------------------------------------
// Base de conhecimento
// ---------------------------------------------------------------------------
export const atividades = pgTable("atividades", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  categoria: text("categoria"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const atividadeTermos = pgTable("atividade_termos", {
  id: serial("id").primaryKey(),
  atividadeId: integer("atividade_id")
    .notNull()
    .references(() => atividades.id, { onDelete: "cascade" }),
  termo: text("termo").notNull(),
});

export const riscos = pgTable("riscos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const nrs = pgTable("nrs", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  descricao: text("descricao").notNull(),
});

export const riscoNr = pgTable("risco_nr", {
  id: serial("id").primaryKey(),
  riscoId: integer("risco_id")
    .notNull()
    .references(() => riscos.id, { onDelete: "cascade" }),
  nrId: integer("nr_id")
    .notNull()
    .references(() => nrs.id, { onDelete: "cascade" }),
});

export const medidasControle = pgTable("medidas_controle", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  tipoControle: tipoControleEnum("tipo_controle").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const atividadeRisco = pgTable("atividade_risco", {
  id: serial("id").primaryKey(),
  atividadeId: integer("atividade_id")
    .notNull()
    .references(() => atividades.id, { onDelete: "cascade" }),
  riscoId: integer("risco_id")
    .notNull()
    .references(() => riscos.id, { onDelete: "cascade" }),
  probabilidade: text("probabilidade").notNull().default("media"),
  severidade: text("severidade").notNull().default("moderada"),
});

export const riscoControle = pgTable("risco_controle", {
  id: serial("id").primaryKey(),
  riscoId: integer("risco_id")
    .notNull()
    .references(() => riscos.id, { onDelete: "cascade" }),
  controleId: integer("controle_id")
    .notNull()
    .references(() => medidasControle.id, { onDelete: "cascade" }),
  obrigatorio: boolean("obrigatorio").notNull().default(false),
});

export const buscaLog = pgTable("busca_log", {
  id: serial("id").primaryKey(),
  textoBusca: text("texto_busca").notNull(),
  melhorScore: real("melhor_score").notNull().default(0),
  satisfatoria: boolean("satisfatoria").notNull().default(false),
  revisada: boolean("revisada").notNull().default(false),
  usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// APR (com snapshot dos itens)
// ---------------------------------------------------------------------------
export const apr = pgTable("apr", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  obraId: integer("obra_id").references(() => obras.id, { onDelete: "set null" }),
  localObra: text("local_obra").notNull(),
  responsavel: text("responsavel").notNull(),
  equipe: text("equipe"),
  dataExecucao: date("data_execucao"),
  descricaoServico: text("descricao_servico").notNull(),
  status: aprStatusEnum("status").notNull().default("rascunho"),
  etapaAtual: integer("etapa_atual").notNull().default(1),
  revisadaPeloAutor: boolean("revisada_pelo_autor").notNull().default(false),
  criadoPor: integer("criado_por").references(() => usuarios.id, { onDelete: "set null" }),
  aprovadoPor: integer("aprovado_por").references(() => usuarios.id, { onDelete: "set null" }),
  motivoReprovacao: text("motivo_reprovacao"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  submetidoEm: timestamp("submetido_em", { withTimezone: true }),
  aprovadoEm: timestamp("aprovado_em", { withTimezone: true }),
});

export const aprAtividade = pgTable("apr_atividade", {
  id: serial("id").primaryKey(),
  aprId: integer("apr_id")
    .notNull()
    .references(() => apr.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull().default(0),
  atividadeNomeSnapshot: text("atividade_nome_snapshot").notNull(),
  atividadeCategoriaSnapshot: text("atividade_categoria_snapshot"),
  atividadeOrigemId: integer("atividade_origem_id").references(() => atividades.id, {
    onDelete: "set null",
  }),
  origem: origemItemEnum("origem").notNull().default("base"),
});

export const aprRisco = pgTable("apr_risco", {
  id: serial("id").primaryKey(),
  aprAtividadeId: integer("apr_atividade_id")
    .notNull()
    .references(() => aprAtividade.id, { onDelete: "cascade" }),
  riscoNomeSnapshot: text("risco_nome_snapshot").notNull(),
  nrsSnapshot: text("nrs_snapshot"),
  probabilidade: text("probabilidade").notNull().default("media"),
  severidade: text("severidade").notNull().default("moderada"),
  revisado: boolean("revisado").notNull().default(false),
  riscoOrigemId: integer("risco_origem_id").references(() => riscos.id, { onDelete: "set null" }),
  origem: origemItemEnum("origem").notNull().default("base"),
});

export const aprControle = pgTable("apr_controle", {
  id: serial("id").primaryKey(),
  aprRiscoId: integer("apr_risco_id")
    .notNull()
    .references(() => aprRisco.id, { onDelete: "cascade" }),
  controleNomeSnapshot: text("controle_nome_snapshot").notNull(),
  tipoControleSnapshot: tipoControleEnum("tipo_controle_snapshot").notNull(),
  obrigatorio: boolean("obrigatorio").notNull().default(false),
  selecionado: boolean("selecionado").notNull().default(true),
  justificativa: text("justificativa"),
  controleOrigemId: integer("controle_origem_id").references(() => medidasControle.id, {
    onDelete: "set null",
  }),
  origem: origemItemEnum("origem").notNull().default("base"),
});

// ---------------------------------------------------------------------------
// Enums
