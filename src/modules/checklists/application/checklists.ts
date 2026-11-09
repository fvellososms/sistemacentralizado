import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { parseImageDataUrl } from "@/modules/quality/domain/non-conformities";
import { getProjects } from "@/modules/projects/server";
import type { SessionUser } from "@/modules/users/server";
import {
  CHECKLIST_CSV_MAX_BYTES,
  CHECKLIST_FOTOS_MAX,
  CHECKLIST_FOTO_MAX_BYTES,
  CHECKLIST_ITENS_MAX,
  isIconeValido,
  nomeDoModelo,
  parseChecklistCsv,
  validateInspecao,
  type InspecaoInput,
} from "../domain/checklists";
import { checklistRepository as repo } from "../infrastructure/checklist-repository";
import { StorageNaoConfigurado, photoStorage } from "../infrastructure/photo-storage";

const ARMAZENAMENTO_INDISPONIVEL =
  "O armazenamento de fotos não está configurado. Peça ao administrador para definir a chave SUPABASE_SECRET_KEY.";

export const listarModelos = () => withDatabase(() => repo.listModelos());

export async function obterModelo(id: number) {
  const modelo = await withDatabase(() => repo.findModelo(id));
  if (!modelo) throw AppError.notFound("Checklist não encontrado.");
  return modelo;
}

/** Admin: adds a template from a CSV file, or replaces the questions of the one with the same name. */
export async function importarModelo(body: { arquivo?: unknown; csv?: unknown }) {
  if (typeof body.arquivo !== "string" || typeof body.csv !== "string" || !body.csv.trim()) throw AppError.badRequest("Envie o arquivo CSV do checklist.");
  if (new TextEncoder().encode(body.csv).length > CHECKLIST_CSV_MAX_BYTES) throw AppError.badRequest("O CSV deve ter até 256 KB.");
  const nome = nomeDoModelo(body.arquivo);
  const itens = parseChecklistCsv(body.csv);
  if (!nome || nome.length > 255) throw AppError.badRequest("Nome de arquivo inválido.");
  if (!itens.length) throw new AppError(`${nome}: o arquivo não tem perguntas.`, 422, "CSV_INVALIDO");
  if (itens.length > CHECKLIST_ITENS_MAX) throw new AppError(`${nome}: máximo de ${CHECKLIST_ITENS_MAX} perguntas.`, 422, "CSV_INVALIDO");
  return withDatabase(() => repo.salvarModelo(nome, itens));
}

export async function definirModeloAtivo(id: number, ativo: unknown) {
  if (typeof ativo !== "boolean") throw AppError.badRequest("Requisição inválida.");
  if (!(await withDatabase(() => repo.definirAtivo(id, ativo)))) throw AppError.notFound("Checklist não encontrado.");
}

export const listarInspecoes = (projectId?: number) => withDatabase(() => repo.listInspecoes(projectId));

export async function criarInspecao(body: Partial<InspecaoInput>, sessao: SessionUser) {
  const erro = validateInspecao(body);
  if (erro) throw new AppError(erro, 422, "INSPECAO_INVALIDA");
  const input = body as InspecaoInput;
  const obra = (await getProjects()).find((p) => p.id === input.projectId);
  if (!obra) throw AppError.badRequest("Obra não encontrada.");
  const { respostas, ...campos } = input;
  return withDatabase(() =>
    repo.criarInspecao(
      {
        ...campos,
        modeloNome: campos.modeloNome.trim(),
        modeloId: Number.isInteger(campos.modeloId) ? campos.modeloId : null,
        projectName: obra.name,
        empresaCliente: obra.clientCompanyName ?? null,
        assinaturaTecnico: campos.assinaturaTecnico || null,
        assinaturaOperador: campos.assinaturaOperador || null,
        criadoPorId: sessao.id,
        criadoPorNome: sessao.name,
      },
      respostas.map((r) => ({ pergunta: r.pergunta, icone: isIconeValido(r.icone) ? r.icone : null, resposta: r.resposta, comentario: r.comentario.trim() }))
    )
  );
}

export async function obterInspecao(id: number) {
  const inspecao = await withDatabase(() => repo.findInspecao(id));
  if (!inspecao) throw AppError.notFound("Inspeção não encontrada.");
  return { ...inspecao, fotos: inspecao.fotos.map((f) => ({ id: f.id, ordem: f.ordem })) };
}

/** One photo per request (keeps each request under the hosting size limit); sending it again replaces it. */
export async function anexarFoto(inspecaoId: number, body: { ordem?: unknown; foto?: unknown }) {
  const ordem = body.ordem;
  if (!Number.isInteger(ordem) || (ordem as number) < 1 || (ordem as number) > CHECKLIST_FOTOS_MAX) throw AppError.badRequest("Foto inválida.");
  const foto = typeof body.foto === "string" ? parseImageDataUrl(body.foto) : null;
  if (!foto || !/^image\/(jpeg|png)$/.test(foto.mimeType)) throw new AppError("A foto deve ser JPEG ou PNG.", 422, "FOTO_INVALIDA");
  if (foto.bytes > CHECKLIST_FOTO_MAX_BYTES) throw new AppError("A foto excede o tamanho máximo de 3 MB.", 422, "FOTO_INVALIDA");

  const inspecao = await withDatabase(() => repo.findInspecao(inspecaoId));
  if (!inspecao) throw AppError.notFound("Inspeção não encontrada.");
  const caminho = `${inspecao.clientId}/${ordem}.${foto.mimeType === "image/png" ? "png" : "jpg"}`;
  try {
    await photoStorage.enviar(caminho, Buffer.from(foto.base64, "base64"), foto.mimeType);
  } catch (error) {
    if (error instanceof StorageNaoConfigurado) throw AppError.serviceUnavailable(ARMAZENAMENTO_INDISPONIVEL, "STORAGE_NAO_CONFIGURADO");
    console.error("Falha ao enviar foto do checklist:", error);
    throw AppError.serviceUnavailable("Não foi possível enviar a foto. Tente novamente.", "STORAGE_FALHOU");
  }
  await withDatabase(() => repo.salvarFoto(inspecaoId, ordem as number, caminho, foto.mimeType));
}

export async function baixarFoto(inspecaoId: number, fotoId: number) {
  const foto = await withDatabase(() => repo.findFoto(fotoId));
  if (!foto || foto.inspecaoId !== inspecaoId) throw AppError.notFound("Foto não encontrada.");
  let arquivo: Blob | null;
  try {
    arquivo = await photoStorage.baixar(foto.caminho);
  } catch (error) {
    if (error instanceof StorageNaoConfigurado) throw AppError.serviceUnavailable(ARMAZENAMENTO_INDISPONIVEL, "STORAGE_NAO_CONFIGURADO");
    throw error;
  }
  if (!arquivo) throw AppError.notFound("Foto não encontrada.");
  return { arquivo, tipo: foto.tipo };
}
