import { db } from "@/db";
import { workspaceTasks } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type { Task, TaskRecord, TaskStage } from "../domain/tasks";

type TaskRow = typeof workspaceTasks.$inferSelect;

export interface TaskRepository {
  findMany(): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  create(data: TaskRecord): Promise<Task>;
  /** `stageChanged` restarts the idle counter used by the stalled-tasks panel. */
  update(id: number, data: TaskRecord, stageChanged: boolean): Promise<Task | null>;
  delete(id: number): Promise<boolean>;
}

const LIST_LIMIT = 5000;

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  company: row.company,
  collaboratorId: row.collaboratorId,
  collaborator: row.collaborator,
  category: row.category,
  stage: row.stage as TaskStage,
  dueDate: row.dueDate,
  notes: row.notes,
  stageChangedAt: row.stageChangedAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
});

let tasksTableUnavailableUntil = 0;
const TABLE_COOLDOWN_MS = 60_000;

export class DrizzleTaskRepository implements TaskRepository {
  async findMany(): Promise<Task[]> {
    if (Date.now() < tasksTableUnavailableUntil) {
      return [];
    }
    try {
      const rows = await db
        .select()
        .from(workspaceTasks)
        .orderBy(asc(workspaceTasks.createdAt), asc(workspaceTasks.id))
        .limit(LIST_LIMIT);
      return rows.map(toTask);
    } catch (error) {
      tasksTableUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      console.warn("Falha ao listar tarefas do espaço de trabalho; retornando lista vazia:", error);
      return [];
    }
  }

  async findById(id: number): Promise<Task | null> {
    if (Date.now() < tasksTableUnavailableUntil) {
      return null;
    }
    try {
      const [row] = await db.select().from(workspaceTasks).where(eq(workspaceTasks.id, id)).limit(1);
      return row ? toTask(row) : null;
    } catch (error) {
      tasksTableUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      console.warn("Falha ao buscar tarefa do espaço de trabalho:", error);
      return null;
    }
  }

  async create(data: TaskRecord): Promise<Task> {
    const [row] = await db.insert(workspaceTasks).values(data).returning();
    return toTask(row);
  }

  async update(id: number, data: TaskRecord, stageChanged: boolean): Promise<Task | null> {
    const now = new Date();
    const [row] = await db
      .update(workspaceTasks)
      .set({ ...data, updatedAt: now, ...(stageChanged ? { stageChangedAt: now } : {}) })
      .where(eq(workspaceTasks.id, id))
      .returning();
    return row ? toTask(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db.delete(workspaceTasks).where(eq(workspaceTasks.id, id)).returning({ id: workspaceTasks.id });
    return rows.length > 0;
  }
}

export const defaultTaskRepository = new DrizzleTaskRepository();
