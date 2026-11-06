import { pgTable, serial, text, varchar, integer, boolean, timestamp, numeric, date, real, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";

// Empresas clientes da consultoria; cada obra pertence a uma empresa cliente.
export const clientCompanies = pgTable("client_companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 20 }),
  contactName: varchar("contact_name", { length: 180 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull().default("Construtora Aliança S/A"),
  address: text("address").notNull(),
  managerName: varchar("manager_name", { length: 255 }).notNull().default("Eng. Roberto Albuquerque"),
  status: varchar("status", { length: 50 }).notNull().default("Em andamento"),
  startDate: varchar("start_date", { length: 50 }).notNull(),
  clientCompanyId: integer("client_company_id").references(() => clientCompanies.id, { onDelete: "set null" }),
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
  accessLevel: varchar("access_level", { length: 20 }).notNull().default("usuario"), // admin, usuario
  active: boolean("active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rdos = pgTable("rdos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  rdoNumber: integer("rdo_number").notNull(),
  date: varchar("date", { length: 20 }).notNull(), // YYYY-MM-DD
  dayOfWeek: varchar("day_of_week", { length: 20 }), // qui, sex, etc.
  dayStatus: varchar("day_status", { length: 50 }).notNull().default("trabalhando"), // trabalhando, nao_trabalhando, paralisado_chuva
  workCondition: varchar("work_condition", { length: 50 }).notNull().default("praticavel"), // derived: impraticavel if any shift is
  workConditionMorning: varchar("work_condition_morning", { length: 50 }).notNull().default("praticavel"), // praticavel, impraticavel
  workConditionAfternoon: varchar("work_condition_afternoon", { length: 50 }).notNull().default("praticavel"), // praticavel, impraticavel
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
}, (t) => [index("rdos_project_date_idx").on(t.projectId, t.date)]);

export const rdoContractors = pgTable("rdo_contractors", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  trade: varchar("trade", { length: 255 }).notNull(),
  workerCount: integer("worker_count").notNull().default(1),
}, (t) => [index("rdo_contractors_rdo_idx").on(t.rdoId)]);

export const rdoActivities = pgTable("rdo_activities", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("em_andamento"), // em_andamento, concluido
  hasOvertime: boolean("has_overtime").notNull().default(false),
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).default("0"),
}, (t) => [index("rdo_activities_rdo_idx").on(t.rdoId)]);

export const rdoNonConformities = pgTable("rdo_non_conformities", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  nr: varchar("nr", { length: 100 }),
  severity: varchar("severity", { length: 50 }).notNull().default("media"), // baixa, media, alta
  correctiveAction: text("corrective_action"),
  status: varchar("status", { length: 50 }).notNull().default("resolvido"), // resolvido, pendente
}, (t) => [index("rdo_non_conformities_rdo_idx").on(t.rdoId)]);

export const rdoOccurrences = pgTable("rdo_occurrences", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id").notNull().references(() => rdos.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(1),
  category: varchar("category", { length: 100 }).notNull().default("Geral"), // Acidente, Falta de Material, Fiscalização, Entrega, Clima
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  impactedHours: numeric("impacted_hours", { precision: 5, scale: 2 }).default("0"),
}, (t) => [index("rdo_occurrences_rdo_idx").on(t.rdoId)]);

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
}, (t) => [index("rdo_photos_rdo_idx").on(t.rdoId)]);

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
}, (t) => [index("atividade_termos_atividade_idx").on(t.atividadeId)]);

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
}, (t) => [index("risco_nr_risco_idx").on(t.riscoId)]);

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
}, (t) => [index("atividade_risco_atividade_idx").on(t.atividadeId)]);

export const riscoControle = pgTable("risco_controle", {
  id: serial("id").primaryKey(),
  riscoId: integer("risco_id")
    .notNull()
    .references(() => riscos.id, { onDelete: "cascade" }),
  controleId: integer("controle_id")
    .notNull()
    .references(() => medidasControle.id, { onDelete: "cascade" }),
  obrigatorio: boolean("obrigatorio").notNull().default(false),
}, (t) => [index("risco_controle_risco_idx").on(t.riscoId)]);

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
}, (t) => [index("apr_obra_atualizado_idx").on(t.obraId, t.atualizadoEm)]);

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
}, (t) => [index("apr_atividade_apr_idx").on(t.aprId)]);

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
}, (t) => [index("apr_risco_atividade_idx").on(t.aprAtividadeId)]);

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
}, (t) => [index("apr_controle_risco_idx").on(t.aprRiscoId)]);

// ---------------------------------------------------------------------------
// Enums

// ---------------------------------------------------------------------------
// Qualidade — Não conformidades
// ---------------------------------------------------------------------------
export const naoConformidades = pgTable("nao_conformidades", {
  id: serial("id").primaryKey(),
  // No FK: the active project may come from STATIC_PROJECTS; the name is kept as a snapshot.
  projectId: integer("project_id").notNull(),
  projectName: varchar("project_name", { length: 255 }),
  tipo: varchar("tipo", { length: 30 }).notNull(), // sst, qualidade, ambiental, documental
  grau: varchar("grau", { length: 20 }).notNull(), // baixa, media, grave
  dataOcorrencia: varchar("data_ocorrencia", { length: 20 }).notNull(), // YYYY-MM-DD
  localObra: text("local_obra").notNull(),
  requisitoViolado: text("requisito_violado").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  responsavelNome: varchar("responsavel_nome", { length: 255 }).notNull(),
  responsavelEmail: varchar("responsavel_email", { length: 255 }).notNull(),
  prazo: varchar("prazo", { length: 20 }).notNull(), // YYYY-MM-DD
  fotoUrl: text("foto_url"), // optional photo as an image data URL (base64)
  // aberta, em_tratamento, aguardando_verificacao, encerrada, cancelada ("resolvida" = registros antigos, tratado como encerrada)
  status: varchar("status", { length: 30 }).notNull().default("aberta"),
  resolvidaEm: timestamp("resolvida_em"),
  criadoPor: varchar("criado_por", { length: 255 }),
  acaoImediata: text("acao_imediata"), // contenção adotada logo após a constatação
  causaMetodo: varchar("causa_metodo", { length: 30 }), // cinco_porques, ishikawa, outro
  porques: text("porques"), // JSON: string[]
  causaRaiz: text("causa_raiz"),
  prazoOriginal: varchar("prazo_original", { length: 20 }), // YYYY-MM-DD, preenchido na primeira prorrogação
  verificacaoResultado: varchar("verificacao_resultado", { length: 20 }), // eficaz, ineficaz
  verificacaoObs: text("verificacao_obs"),
  verificadoPor: varchar("verificado_por", { length: 255 }),
  verificadoEm: timestamp("verificado_em"),
  encerradaEm: timestamp("encerrada_em"),
  canceladaMotivo: text("cancelada_motivo"),
  lembretePrazoEm: timestamp("lembrete_prazo_em"),
  lembreteVencidaEm: timestamp("lembrete_vencida_em"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("nao_conformidades_project_data_idx").on(t.projectId, t.dataOcorrencia)]);

// Plano de ação 5W2H da NC.
export const ncAcoes = pgTable("nc_acoes", {
  id: serial("id").primaryKey(),
  ncId: integer("nc_id").notNull().references(() => naoConformidades.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull().default(0),
  oQue: text("o_que").notNull(),
  porQue: text("por_que").notNull(),
  onde: text("onde"),
  quem: varchar("quem", { length: 255 }).notNull(),
  quando: varchar("quando", { length: 20 }).notNull(), // YYYY-MM-DD
  como: text("como").notNull(),
  quanto: varchar("quanto", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("pendente"), // pendente, concluida
  concluidaEm: timestamp("concluida_em"),
  evidencia: text("evidencia"),
  evidenciaFotoUrl: text("evidencia_foto_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("nc_acoes_nc_idx").on(t.ncId)]);

// Histórico da NC (linha do tempo).
export const ncEventos = pgTable("nc_eventos", {
  id: serial("id").primaryKey(),
  ncId: integer("nc_id").notNull().references(() => naoConformidades.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 40 }).notNull(),
  descricao: text("descricao").notNull(),
  autor: varchar("autor", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("nc_eventos_nc_idx").on(t.ncId)]);

// Registro das ações administrativas (LGPD / rastreabilidade).
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id"),
  actorName: varchar("actor_name", { length: 255 }),
  action: varchar("action", { length: 60 }).notNull(),
  entity: varchar("entity", { length: 40 }).notNull(),
  entityId: varchar("entity_id", { length: 40 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("audit_logs_created_idx").on(t.createdAt)]);

// Espaço de trabalho: visitas e atividades manuais registradas no sistema e eventos importados do ESO.
export const workspaceActivities = pgTable(
  "workspace_activities",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 20 }).notNull(), // visita, manual, eso
    externalId: varchar("external_id", { length: 180 }), // identificador no arquivo do ESO; nulo para o resto
    occurredOn: varchar("occurred_on", { length: 20 }).notNull(), // YYYY-MM-DD
    company: varchar("company", { length: 180 }).notNull(),
    collaboratorId: integer("collaborator_id").references(() => userProfiles.id, { onDelete: "set null" }), // usuário do sistema
    collaborator: varchar("collaborator", { length: 180 }).notNull(), // nome (cópia do usuário; texto do arquivo no ESO)
    category: varchar("category", { length: 180 }).notNull(),
    eventCode: varchar("event_code", { length: 20 }), // S-2210, S-2220, S-2240 (ESO)
    quantity: integer("quantity").notNull(),
    submittedQuantity: integer("submitted_quantity").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull(), // completed, pending, overdue · visitas: agendada, realizada, cancelada
    notes: text("notes"), // observação; nas visitas, o resultado
    projectId: integer("project_id"), // visita: obra (sem FK, como nas NCs; o nome fica como cópia)
    projectName: varchar("project_name", { length: 255 }),
    visitType: varchar("visit_type", { length: 30 }), // tecnica, inspecao, auditoria, reuniao, treinamento
    objective: text("objective"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("workspace_activities_source_external_id_idx").on(t.source, t.externalId),
    index("workspace_activities_occurred_on_idx").on(t.occurredOn),
  ]
);

// Fotos das visitas, fora da tabela de atividades para não pesar nas listas.
export const workspaceVisitPhotos = pgTable(
  "workspace_visit_photos",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id").notNull().references(() => workspaceActivities.id, { onDelete: "cascade" }),
    photoUrl: text("photo_url").notNull(), // imagem em data URL (base64)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("workspace_visit_photos_activity_idx").on(t.activityId)]
);

export const workspaceTasks = pgTable("workspace_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  company: varchar("company", { length: 180 }).notNull(),
  collaboratorId: integer("collaborator_id").references(() => userProfiles.id, { onDelete: "set null" }), // usuário do sistema
  collaborator: varchar("collaborator", { length: 180 }).notNull(), // nome (cópia do usuário)
  category: varchar("category", { length: 180 }).notNull().default("Outras atividades"),
  stage: varchar("stage", { length: 20 }).notNull().default("todo"), // todo, doing, done
  dueDate: varchar("due_date", { length: 20 }), // YYYY-MM-DD
  notes: text("notes"),
  stageChangedAt: timestamp("stage_changed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
