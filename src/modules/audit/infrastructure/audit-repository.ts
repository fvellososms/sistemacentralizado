import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { AuditEntry } from "../domain/actions";

export type AuditLogRow = typeof auditLogs.$inferSelect;

export interface AuditRepository {
  insert(entry: AuditEntry): Promise<void>;
  list(limit: number): Promise<AuditLogRow[]>;
}

export class DrizzleAuditRepository implements AuditRepository {
  async insert(entry: AuditEntry): Promise<void> {
    await db.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      actorName: entry.actorName ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId == null ? null : String(entry.entityId),
      details: entry.details ?? null,
    });
  }

  async list(limit: number): Promise<AuditLogRow[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt), desc(auditLogs.id)).limit(limit);
  }
}

export const defaultAuditRepository = new DrizzleAuditRepository();
