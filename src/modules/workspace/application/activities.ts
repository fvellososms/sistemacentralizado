import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { NC_FOTO_MAX_BYTES, parseImageDataUrl } from "@/modules/quality/domain/non-conformities";
import { listTeamMembers, resolveTeamMember, teamNameKey } from "@/modules/users/application/team";
import {
  VISIT_PHOTOS_MAX,
  isSystemSource,
  normalizeActivity,
  todayInSaoPaulo,
  validateActivity,
  type Activity,
  type ActivityInput,
  type ActivitySource,
} from "../domain/activities";
import { ESO_CSV_MAX_BYTES, parseEsoCsv } from "../domain/eso-import";
import { defaultActivityRepository, type ActivityRepository } from "../infrastructure/activity-repository";

const MAX_REPORTED_ERRORS = 5;

/** Body of POST/PATCH: the activity plus its source (visita or manual) and, for visits, the photos. */
export type ActivityBody = Partial<ActivityInput> & { source?: string; photos?: unknown };

export async function listActivities(repo: ActivityRepository = defaultActivityRepository) {
  return repo.findMany();
}

function systemSource(source: unknown): ActivitySource {
  if (source === undefined || source === "manual") return "manual";
  if (source === "visita") return "visita";
  if (source === "eso") throw AppError.badRequest("Registros do ESO são incluídos pela importação do arquivo.");
  throw AppError.badRequest("Origem inválida. Use visita ou atividade manual.");
}

/** Up to 4 JPEG/PNG/WebP images (data URL, max 5 MB each). `undefined` keeps the current photos. */
function validatePhotos(photos: unknown): string[] | undefined {
  if (photos === undefined) return undefined;
  if (!Array.isArray(photos) || photos.length > VISIT_PHOTOS_MAX)
    throw new AppError(`Anexe no máximo ${VISIT_PHOTOS_MAX} fotos.`, 422, "ATIVIDADE_INVALIDA");
  for (const photo of photos) {
    const parsed = typeof photo === "string" ? parseImageDataUrl(photo) : null;
    if (!parsed) throw new AppError("As fotos devem ser imagens JPEG, PNG ou WebP.", 422, "ATIVIDADE_INVALIDA");
    if (parsed.bytes > NC_FOTO_MAX_BYTES) throw new AppError("Cada foto deve ter até 5 MB.", 422, "ATIVIDADE_INVALIDA");
  }
  return photos as string[];
}

/** Validates the body and fills the collaborator name from the selected (active) user. */
async function prepare(body: ActivityBody, source: ActivitySource) {
  const { isValid, errors } = validateActivity(body, source, todayInSaoPaulo());
  if (!isValid) throw new AppError(Object.values(errors).join(" "), 422, "ATIVIDADE_INVALIDA");
  const member = await resolveTeamMember(body.collaboratorId);
  const photos = source === "visita" ? validatePhotos(body.photos) : undefined;
  return { record: normalizeActivity({ ...(body as ActivityInput), collaborator: member.name }, source), photos };
}

/** Visits and manual activities are edited here; ESO records only through a new import. */
async function findEditable(id: number, repo: ActivityRepository): Promise<Activity> {
  const existing = await repo.findById(id);
  if (!existing) throw AppError.notFound("Registro não encontrado.");
  if (!isSystemSource(existing.source))
    throw AppError.forbidden("Registros do ESO são atualizados por uma nova importação do arquivo.");
  return existing;
}

export async function createActivity(body: ActivityBody, repo: ActivityRepository = defaultActivityRepository) {
  const source = systemSource(body.source);
  const { record, photos } = await prepare(body, source);
  return withDatabase(async () => {
    const created = await repo.create(record);
    if (photos?.length) await repo.replacePhotos(created.id, photos);
    return { ...created, photoCount: photos?.length ?? 0 };
  });
}

export async function updateActivity(id: number, body: ActivityBody, repo: ActivityRepository = defaultActivityRepository) {
  const existing = await findEditable(id, repo);
  const { record, photos } = await prepare(body, existing.source);
  return withDatabase(async () => {
    const updated = await repo.update(id, record);
    if (!updated) throw AppError.internal("Não foi possível atualizar o registro.");
    if (photos !== undefined) await repo.replacePhotos(id, photos);
    return updated;
  });
}

export async function deleteActivity(id: number, repo: ActivityRepository = defaultActivityRepository) {
  await findEditable(id, repo);
  if (!(await withDatabase(() => repo.delete(id)))) throw AppError.internal("Não foi possível excluir o registro.");
}

export async function listVisitPhotos(id: number, repo: ActivityRepository = defaultActivityRepository) {
  const existing = await repo.findById(id);
  if (!existing) throw AppError.notFound("Registro não encontrado.");
  return withDatabase(() => repo.listPhotos(id));
}

/**
 * Imports the ESO CSV. Re-importing a row with the same `external_id` updates the existing record.
 * Collaborator names that match an active user (ignoring accents and case) are linked to that user.
 */
export async function importEsoCsv(csv: unknown, repo: ActivityRepository = defaultActivityRepository) {
  if (typeof csv !== "string" || !csv.trim()) throw AppError.badRequest("Envie o conteúdo do CSV do ESO.");
  if (new TextEncoder().encode(csv).length > ESO_CSV_MAX_BYTES)
    throw AppError.badRequest("O CSV deve ter até 1 MB.");

  const { records, errors } = parseEsoCsv(csv);
  if (errors.length) {
    const extra = errors.length > MAX_REPORTED_ERRORS ? ` (+${errors.length - MAX_REPORTED_ERRORS} outras linhas)` : "";
    throw new AppError(`O CSV contém linhas inválidas. ${errors.slice(0, MAX_REPORTED_ERRORS).join(" ")}${extra}`, 422, "CSV_INVALIDO");
  }
  if (!records.length) throw new AppError("O CSV não contém registros.", 422, "CSV_INVALIDO");

  const team = new Map((await listTeamMembers()).map((m) => [teamNameKey(m.name), m.id]));
  return withDatabase(() =>
    repo.upsertExternal(
      records.map((r) => normalizeActivity({ ...r, collaboratorId: team.get(teamNameKey(r.collaborator ?? "")) ?? null }, "eso"))
    )
  );
}

export async function getIntegrationsStatus(repo: ActivityRepository = defaultActivityRepository) {
  return { esoLastSync: await repo.lastUpdatedAt("eso") };
}
