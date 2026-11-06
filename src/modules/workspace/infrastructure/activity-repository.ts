import { db } from "@/db";
import { workspaceActivities, workspaceVisitPhotos } from "@/db/schema";
import { asc, count, desc, eq, max, sql } from "drizzle-orm";
import type { Activity, ActivityRecord, ActivitySource, ActivityStatus, VisitType } from "../domain/activities";

type ActivityRow = typeof workspaceActivities.$inferSelect;

export interface ActivityRepository {
  findMany(): Promise<Activity[]>;
  findById(id: number): Promise<Activity | null>;
  create(data: ActivityRecord): Promise<Activity>;
  update(id: number, data: ActivityRecord): Promise<Activity | null>;
  delete(id: number): Promise<boolean>;
  /** Inserts or updates ESO records, matched by (source, externalId). */
  upsertExternal(records: ActivityRecord[]): Promise<number>;
  lastUpdatedAt(source: ActivitySource): Promise<string | null>;
  listPhotos(activityId: number): Promise<{ id: number; photoUrl: string }[]>;
  replacePhotos(activityId: number, photoUrls: string[]): Promise<void>;
}

const LIST_LIMIT = 50_000;
const UPSERT_CHUNK = 500;

const toActivity = (row: ActivityRow, photoCount = 0): Activity => ({
  id: row.id,
  source: row.source as ActivitySource,
  externalId: row.externalId,
  occurredOn: row.occurredOn,
  company: row.company,
  collaboratorId: row.collaboratorId,
  collaborator: row.collaborator,
  category: row.category,
  eventCode: row.eventCode,
  quantity: row.quantity,
  submittedQuantity: row.submittedQuantity,
  status: row.status as ActivityStatus,
  notes: row.notes,
  projectId: row.projectId,
  projectName: row.projectName,
  visitType: row.visitType as VisitType | null,
  objective: row.objective,
  photoCount,
});

let activitiesTableUnavailableUntil = 0;
const TABLE_COOLDOWN_MS = 60_000;

export class DrizzleActivityRepository implements ActivityRepository {
  async findMany(): Promise<Activity[]> {
    if (Date.now() < activitiesTableUnavailableUntil) {
      return [];
    }
    try {
      const [rows, photoCounts] = await Promise.all([
        db
          .select()
          .from(workspaceActivities)
          .orderBy(desc(workspaceActivities.occurredOn), desc(workspaceActivities.id))
          .limit(LIST_LIMIT),
        // Only the number of photos goes to the list; the images are loaded on demand.
        db
          .select({ activityId: workspaceVisitPhotos.activityId, total: count() })
          .from(workspaceVisitPhotos)
          .groupBy(workspaceVisitPhotos.activityId),
      ]);
      const totals = new Map(photoCounts.map((p) => [p.activityId, p.total]));
      return rows.map((row) => toActivity(row, totals.get(row.id) ?? 0));
    } catch (error) {
      activitiesTableUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      console.warn("Falha ao listar atividades do espaço de trabalho; retornando lista vazia:", error);
      return [];
    }
  }

  async findById(id: number): Promise<Activity | null> {
    if (Date.now() < activitiesTableUnavailableUntil) {
      return null;
    }
    try {
      const [row] = await db.select().from(workspaceActivities).where(eq(workspaceActivities.id, id)).limit(1);
      return row ? toActivity(row) : null;
    } catch (error) {
      activitiesTableUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      console.warn("Falha ao buscar atividade do espaço de trabalho:", error);
      return null;
    }
  }

  async create(data: ActivityRecord): Promise<Activity> {
    const [row] = await db.insert(workspaceActivities).values(data).returning();
    return toActivity(row);
  }

  async update(id: number, data: ActivityRecord): Promise<Activity | null> {
    const [row] = await db
      .update(workspaceActivities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspaceActivities.id, id))
      .returning();
    return row ? toActivity(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db
      .delete(workspaceActivities)
      .where(eq(workspaceActivities.id, id))
      .returning({ id: workspaceActivities.id });
    return rows.length > 0;
  }

  async upsertExternal(records: ActivityRecord[]): Promise<number> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < records.length; i += UPSERT_CHUNK) {
        await tx
          .insert(workspaceActivities)
          .values(records.slice(i, i + UPSERT_CHUNK))
          .onConflictDoUpdate({
            target: [workspaceActivities.source, workspaceActivities.externalId],
            set: {
              occurredOn: sql`excluded.occurred_on`,
              company: sql`excluded.company`,
              collaboratorId: sql`excluded.collaborator_id`,
              collaborator: sql`excluded.collaborator`,
              category: sql`excluded.category`,
              eventCode: sql`excluded.event_code`,
              quantity: sql`excluded.quantity`,
              submittedQuantity: sql`excluded.submitted_quantity`,
              status: sql`excluded.status`,
              notes: sql`excluded.notes`,
              updatedAt: new Date(),
            },
          });
      }
    });
    return records.length;
  }

  async lastUpdatedAt(source: ActivitySource): Promise<string | null> {
    try {
      const [row] = await db
        .select({ last: max(workspaceActivities.updatedAt) })
        .from(workspaceActivities)
        .where(eq(workspaceActivities.source, source));
      return row?.last ? new Date(row.last).toISOString() : null;
    } catch (error) {
      console.warn("Falha ao consultar a última importação:", error);
      return null;
    }
  }

  async listPhotos(activityId: number): Promise<{ id: number; photoUrl: string }[]> {
    return db
      .select({ id: workspaceVisitPhotos.id, photoUrl: workspaceVisitPhotos.photoUrl })
      .from(workspaceVisitPhotos)
      .where(eq(workspaceVisitPhotos.activityId, activityId))
      .orderBy(asc(workspaceVisitPhotos.id));
  }

  async replacePhotos(activityId: number, photoUrls: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(workspaceVisitPhotos).where(eq(workspaceVisitPhotos.activityId, activityId));
      if (photoUrls.length) await tx.insert(workspaceVisitPhotos).values(photoUrls.map((photoUrl) => ({ activityId, photoUrl })));
    });
  }
}

export const defaultActivityRepository = new DrizzleActivityRepository();
