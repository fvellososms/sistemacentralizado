import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceReminders } from "@/db/schema";
import type { Reminder, ReminderRecord } from "../domain/reminders";

type ReminderRow = typeof workspaceReminders.$inferSelect;

const LIST_LIMIT = 5000;

const toReminder = (row: ReminderRow): Reminder => ({
  id: row.id,
  title: row.title,
  date: row.date,
  time: row.time,
  notes: row.notes,
  done: row.done,
  doneAt: row.doneAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

/** Every query is limited to the owner: a reminder of someone else is never read nor changed. */
export const reminderRepository = {
  async findMany(userId: number): Promise<Reminder[]> {
    const rows = await db
      .select()
      .from(workspaceReminders)
      .where(eq(workspaceReminders.userId, userId))
      .orderBy(asc(workspaceReminders.date), asc(workspaceReminders.time))
      .limit(LIST_LIMIT);
    return rows.map(toReminder);
  },

  async create(userId: number, data: ReminderRecord): Promise<Reminder> {
    const [row] = await db.insert(workspaceReminders).values({ ...data, userId }).returning();
    return toReminder(row);
  },

  async update(userId: number, id: number, data: Partial<ReminderRecord> & { done?: boolean }): Promise<Reminder | null> {
    const doneAt = data.done === undefined ? {} : { doneAt: data.done ? new Date() : null };
    const [row] = await db
      .update(workspaceReminders)
      .set({ ...data, ...doneAt, updatedAt: new Date() })
      .where(and(eq(workspaceReminders.id, id), eq(workspaceReminders.userId, userId)))
      .returning();
    return row ? toReminder(row) : null;
  },

  async delete(userId: number, id: number): Promise<boolean> {
    const rows = await db
      .delete(workspaceReminders)
      .where(and(eq(workspaceReminders.id, id), eq(workspaceReminders.userId, userId)))
      .returning({ id: workspaceReminders.id });
    return rows.length > 0;
  },
};

export type ReminderRepository = typeof reminderRepository;
