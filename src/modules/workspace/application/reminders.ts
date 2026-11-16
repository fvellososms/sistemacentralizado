import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { normalizeReminder, validateReminder, type ReminderInput } from "../domain/reminders";
import { reminderRepository, type ReminderRepository } from "../infrastructure/reminder-repository";

const NOT_FOUND = "Lembrete não encontrado.";

function prepare(body: Partial<ReminderInput>) {
  const { isValid, errors } = validateReminder(body);
  if (!isValid) throw new AppError(Object.values(errors).join(" "), 422, "LEMBRETE_INVALIDO");
  return normalizeReminder(body as ReminderInput);
}

export const listReminders = (userId: number, repo: ReminderRepository = reminderRepository) =>
  withDatabase(() => repo.findMany(userId));

export async function createReminder(userId: number, body: Partial<ReminderInput>, repo: ReminderRepository = reminderRepository) {
  const data = prepare(body);
  return withDatabase(() => repo.create(userId, data));
}

/** PATCH: `{ done }` alone marks it as done or open again; otherwise the whole reminder is edited. */
export async function updateReminder(
  userId: number,
  id: number,
  body: Partial<ReminderInput> & { done?: unknown },
  repo: ReminderRepository = reminderRepository
) {
  const keys = Object.keys(body ?? {});
  let data;
  if (keys.length === 1 && keys[0] === "done") {
    if (typeof body.done !== "boolean") throw AppError.badRequest("Requisição inválida.");
    data = { done: body.done };
  } else {
    data = prepare(body);
  }
  const updated = await withDatabase(() => repo.update(userId, id, data));
  if (!updated) throw AppError.notFound(NOT_FOUND);
  return updated;
}

export async function deleteReminder(userId: number, id: number, repo: ReminderRepository = reminderRepository) {
  if (!(await withDatabase(() => repo.delete(userId, id)))) throw AppError.notFound(NOT_FOUND);
}
