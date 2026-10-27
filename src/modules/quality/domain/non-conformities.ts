/**
 * Pure rules for non-conformities (NC) registered in the Quality section.
 */

export const NC_TIPOS = {
  sst: "Segurança do trabalho (SST)",
  qualidade: "Qualidade / execução",
  ambiental: "Meio ambiente",
  documental: "Documental / legal",
} as const;

export const NC_GRAUS = {
  baixa: "Baixa",
  media: "Média",
  grave: "Grave",
} as const;

export const NC_SITUACOES = {
  aberta: "Aberta",
  vencida: "Vencida",
  resolvida: "Resolvida",
} as const;

export type NcTipo = keyof typeof NC_TIPOS;
export type NcGrau = keyof typeof NC_GRAUS;
export type NcStatus = "aberta" | "resolvida";
export type NcSituacao = keyof typeof NC_SITUACOES;

export interface NaoConformidadeInput {
  projectId: number;
  projectName?: string;
  tipo: NcTipo;
  grau: NcGrau;
  dataOcorrencia: string; // YYYY-MM-DD
  localObra: string;
  requisitoViolado: string;
  titulo: string;
  descricao: string;
  responsavelNome: string;
  responsavelEmail: string;
  prazo: string; // YYYY-MM-DD
}

export type NaoConformidadeErrors = Partial<Record<keyof NaoConformidadeInput, string>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidDate = (v: unknown): v is string =>
  typeof v === "string" && DATE_RE.test(v) && !isNaN(new Date(`${v}T12:00:00Z`).getTime());

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * Validates a new NC. Every field is mandatory; the deadline cannot be earlier than
 * the occurrence date and the occurrence cannot be in the future.
 * `hoje` (YYYY-MM-DD) is injected to keep the rule deterministic.
 */
export function validateNaoConformidade(
  input: Partial<NaoConformidadeInput>,
  hoje: string
): { isValid: boolean; errors: NaoConformidadeErrors } {
  const errors: NaoConformidadeErrors = {};

  if (!input.projectId || input.projectId <= 0) errors.projectId = "Selecione a obra.";
  if (!input.tipo || !(input.tipo in NC_TIPOS)) errors.tipo = "Selecione o tipo da NC.";
  if (!input.grau || !(input.grau in NC_GRAUS)) errors.grau = "Selecione o grau da NC.";

  if (!isValidDate(input.dataOcorrencia)) errors.dataOcorrencia = "Informe a data da ocorrência.";
  else if (input.dataOcorrencia > hoje) errors.dataOcorrencia = "A data da ocorrência não pode ser futura.";

  if (!filled(input.localObra)) errors.localObra = "Informe o local da obra.";
  if (!filled(input.requisitoViolado)) errors.requisitoViolado = "Informe o requisito violado.";
  if (!filled(input.titulo)) errors.titulo = "Informe o título da NC.";
  if (!filled(input.descricao)) errors.descricao = "Descreva a NC (o que, onde e quando).";
  if (!filled(input.responsavelNome)) errors.responsavelNome = "Informe o responsável pela obra.";

  if (!filled(input.responsavelEmail)) errors.responsavelEmail = "Informe o e-mail do responsável.";
  else if (!EMAIL_RE.test(input.responsavelEmail!.trim())) errors.responsavelEmail = "E-mail inválido.";

  if (!isValidDate(input.prazo)) errors.prazo = "Informe o prazo para resolver a NC.";
  else if (isValidDate(input.dataOcorrencia) && input.prazo < input.dataOcorrencia)
    errors.prazo = "O prazo não pode ser anterior à data da ocorrência.";

  return { isValid: Object.keys(errors).length === 0, errors };
}

/** Situation shown to the user: an open NC past its deadline is overdue. */
export function getNcSituacao(nc: { status: string; prazo: string }, hoje: string): NcSituacao {
  if (nc.status === "resolvida") return "resolvida";
  return nc.prazo < hoje ? "vencida" : "aberta";
}

/** Whole days until the deadline (negative when overdue). */
export function diasAtePrazo(prazo: string, hoje: string): number {
  const ms = new Date(`${prazo}T12:00:00Z`).getTime() - new Date(`${hoje}T12:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}
