export type Perfil = "colaborador" | "admin_sst" | "aprovador";
export type TipoControle = "eliminacao" | "substituicao" | "engenharia" | "administrativo" | "epi";
export type AprStatus = "rascunho" | "aguardando_aprovacao" | "aprovada" | "reprovada";
export type Probabilidade = "baixa" | "media" | "alta";
export type Severidade = "leve" | "moderada" | "grave";
export type Origem = "base" | "manual";
export type Relevancia = "alta" | "possivel" | "baixa";

export const TIPO_CONTROLE_LABEL: Record<TipoControle, string> = {
  eliminacao: "Eliminação",
  substituicao: "Substituição",
  engenharia: "Controle de engenharia",
  administrativo: "Administrativo",
  epi: "EPI",
};

export const TIPO_CONTROLE_ORDEM: TipoControle[] = [
  "eliminacao",
  "substituicao",
  "engenharia",
  "administrativo",
  "epi",
];

export const PROBABILIDADE_LABEL: Record<Probabilidade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const SEVERIDADE_LABEL: Record<Severidade, string> = {
  leve: "Leve",
  moderada: "Moderada",
  grave: "Grave",
};

export const STATUS_LABEL: Record<AprStatus, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovada: "Aprovada",
  reprovada: "Reprovada / devolvida",
};

export const PERFIL_LABEL: Record<Perfil, string> = {
  colaborador: "Colaborador",
  admin_sst: "Administrador SST",
  aprovador: "Aprovador",
};

// ---------------------------------------------------------------------------
// Estruturas usadas pelo wizard (estado do cliente e payload da API)
// ---------------------------------------------------------------------------
export interface ControleDraft {
  key: string;
  nome: string;
  tipoControle: TipoControle;
  obrigatorio: boolean;
  selecionado: boolean;
  justificativa?: string;
  controleOrigemId: number | null;
  origem: Origem;
}

export interface RiscoDraft {
  key: string;
  nome: string;
  nrs: string[];
  probabilidade: Probabilidade;
  severidade: Severidade;
  /** Risco incluído na APR (aplicável à situação da obra). */
  selecionado: boolean;
  /** Usuário avaliou a sugestão. */
  revisado: boolean;
  riscoOrigemId: number | null;
  origem: Origem;
  controles: ControleDraft[];
}

export interface AtividadeDraft {
  key: string;
  nome: string;
  categoria: string | null;
  atividadeOrigemId: number | null;
  origem: Origem;
  relevancia?: Relevancia;
  riscos: RiscoDraft[];
}

export interface AprDraft {
  id: number | null;
  codigo: string | null;
  status: AprStatus;
  obraId: number | null;
  localObra: string;
  responsavel: string;
  equipe: string;
  dataExecucao: string;
  descricaoServico: string;
  etapaAtual: number;
  revisadaPeloAutor: boolean;
  atividades: AtividadeDraft[];
  motivoReprovacao?: string | null;
}

export interface SugestaoAtividade {
  id: number;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  score: number;
  relevancia: Relevancia;
  termosCorrespondentes: string[];
  qtdRiscos: number;
}

export interface BuscaResposta {
  sugestoes: SugestaoAtividade[];
  melhorScore: number;
  satisfatoria: boolean;
  trechos: string[];
  interpretadoPorIa: boolean;
}

export interface RiscoBase {
  id: number;
  nome: string;
  descricao: string | null;
  probabilidade: Probabilidade;
  severidade: Severidade;
  nrs: string[];
  controles: {
    id: number;
    nome: string;
    descricao: string | null;
    tipoControle: TipoControle;
    obrigatorio: boolean;
  }[];
}

export function novaKey(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
