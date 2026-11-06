import { AppError } from "@/shared/errors/AppError";
import { resolveTeamMember } from "@/modules/users/application/team";
import { normalizeTask, validateTask, type TaskInput } from "../domain/tasks";
import { defaultTaskRepository, type TaskRepository } from "../infrastructure/task-repository";

export async function listTasks(repo: TaskRepository = defaultTaskRepository) {
  return repo.findMany();
}

/** Validates the task and takes the collaborator name from the selected (active) user. */
async function prepare(input: Partial<TaskInput>) {
  const { isValid, errors } = validateTask(input);
  if (!isValid) throw new AppError(Object.values(errors).join(" "), 422, "TAREFA_INVALIDA");
  const member = await resolveTeamMember(input.collaboratorId);
  return normalizeTask(input as TaskInput, member.name);
}

export async function createTask(input: Partial<TaskInput>, repo: TaskRepository = defaultTaskRepository) {
  return repo.create(await prepare(input));
}

export async function updateTask(id: number, input: Partial<TaskInput>, repo: TaskRepository = defaultTaskRepository) {
  const existing = await repo.findById(id);
  if (!existing) throw AppError.notFound("Tarefa não encontrada.");
  const data = await prepare(input);
  const updated = await repo.update(id, data, data.stage !== existing.stage);
  if (!updated) throw AppError.internal("Não foi possível atualizar a tarefa.");
  return updated;
}

export async function deleteTask(id: number, repo: TaskRepository = defaultTaskRepository) {
  if (!(await repo.delete(id))) throw AppError.notFound("Tarefa não encontrada.");
}
