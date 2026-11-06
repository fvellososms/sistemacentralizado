import { withDatabase } from "@/shared/errors/with-database";
import type { AuditEntry } from "../domain/actions";
import { defaultAuditRepository, type AuditRepository } from "../infrastructure/audit-repository";

/** Never throws: an audit failure must not undo the action that was already done. */
export async function recordAudit(entry: AuditEntry, repo: AuditRepository = defaultAuditRepository): Promise<void> {
  try {
    await repo.insert(entry);
  } catch (error) {
    console.error("Falha ao registrar auditoria:", entry.action, error);
  }
}

export async function listAuditLogs(limit = 200, repo: AuditRepository = defaultAuditRepository) {
  return withDatabase(() => repo.list(Math.min(Math.max(limit, 1), 1000)));
}
