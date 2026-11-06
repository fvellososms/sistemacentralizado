/**
 * Administrative actions recorded in the audit log, with the labels shown on the admin screen.
 */

export const AUDIT_ACTIONS = {
  user_created: "Usuário criado",
  user_updated: "Usuário alterado",
  user_activated: "Usuário reativado",
  user_deactivated: "Usuário desativado",
  user_password_reset: "Senha redefinida pelo administrador",
  user_unlocked: "Usuário desbloqueado",
  password_changed: "Senha alterada pelo próprio usuário",
  login_locked: "Conta bloqueada por tentativas de login",
  login_legacy_password_refused: "Login recusado: senha antiga fraca",
  company_created: "Empresa cliente cadastrada",
  company_updated: "Empresa cliente alterada",
  project_created: "Obra cadastrada",
  project_updated: "Obra alterada",
  nc_verified: "Eficácia de OM verificada",
  nc_canceled: "OM cancelada",
  nc_deadline_extended: "Prazo de OM prorrogado",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export const AUDIT_ENTITIES = {
  user: "Usuário",
  company: "Empresa cliente",
  project: "Obra",
  nc: "Oportunidade de melhoria",
} as const;

export type AuditEntity = keyof typeof AUDIT_ENTITIES;

export interface AuditEntry {
  actorId?: number | null;
  actorName?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | number | null;
  details?: string | null;
}

export const auditActionLabel = (action: string) => AUDIT_ACTIONS[action as AuditAction] ?? action;
