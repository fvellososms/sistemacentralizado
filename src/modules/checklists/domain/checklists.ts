/**
 * Pre-operational equipment checklists (FVCheck, by Davi Mello Ferreira in collaboration
 * with FVelloso Consultoria em SMS). Pure rules: CSV templates, validation and the client logo path.
 */

export const RESPOSTAS = ["Conforme", "Não conforme", "Não se aplica"] as const;
export type Resposta = (typeof RESPOSTAS)[number];
/** Every item starts as "Conforme"; the inspector changes only what differs. */
export const RESPOSTA_PADRAO: Resposta = "Conforme";

export const PERIODICIDADES = ["Rotineira", "Programada", "Inicial", "Outros"] as const;

export const CHECKLIST_CSV_MAX_BYTES = 256 * 1024;
export const CHECKLIST_ITENS_MAX = 200;
export const CHECKLIST_FOTOS_MAX = 12;
export const CHECKLIST_FOTO_MAX_BYTES = 3 * 1024 * 1024; // the request must fit the 4.5 MB Vercel limit
export const CHECKLIST_ASSINATURA_MAX_LENGTH = 400 * 1024;
const TEXTO_MAX = 255;
const COMENTARIO_MAX = 1000;
const PERGUNTA_MAX = 1000;

export interface ChecklistItem {
  pergunta: string;
  icone: string | null;
}

/** Rows of a tab-separated file. A cell that starts with a quote may contain tabs and line breaks. */
function lerLinhas(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c !== '"') celula += c;
      else if (texto[i + 1] === '"') {
        celula += '"';
        i++;
      } else entreAspas = false;
    } else if (c === '"' && celula === "") entreAspas = true;
    else if (c === "\t") {
      linha.push(celula);
      celula = "";
    } else if (c === "\n") {
      linhas.push([...linha, celula]);
      linha = [];
      celula = "";
    } else if (c !== "\r") celula += c;
  }
  if (celula || linha.length) linhas.push([...linha, celula]);
  return linhas;
}

const limpar = (celula: string | undefined) => (celula ?? "").replace(/\s*\n\s*/g, " ").trim();

/**
 * Template file: tab-separated, UTF-8. The first line is a title (ignored), each next line a question;
 * an optional "Icone" column names the item's symbol. Extra empty columns are ignored.
 */
export function parseChecklistCsv(csv: string): ChecklistItem[] {
  const [titulo = [], ...linhas] = lerLinhas(csv.replace(/^\uFEFF/, ""));
  const colunaIcone = titulo.findIndex((c) => limpar(c).toLowerCase() === "icone");
  const itens: ChecklistItem[] = [];
  for (const colunas of linhas) {
    const pergunta = limpar(colunas[0]);
    if (!pergunta) continue;
    const icone = colunaIcone >= 0 ? limpar(colunas[colunaIcone]) : "";
    itens.push({ pergunta, icone: isIconeValido(icone) ? icone : null });
  }
  return itens;
}

/** Only plain file names: the value ends up in an image path. */
export function isIconeValido(icone: string | null | undefined): icone is string {
  return typeof icone === "string" && /^[\w-]+\.svg$/.test(icone);
}

export const iconePublico = (icone: string) => `/checklist/icones/${icone.replace(/\.svg$/, ".png")}`;

/** "pasta/Checklist - Furadeira.csv" -> "Checklist - Furadeira". */
export const nomeDoModelo = (arquivo: string) => arquivo.split(/[\\/]/).pop()!.replace(/\.csv$/i, "").trim();

/** File name of the client logo: "Hotel Marina" -> "hotel-marina". */
export function logoSlug(empresa: string): string {
  return empresa
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Where the document looks for the logo of the client company (PDF accepts PNG and JPEG). */
export function logoCandidatos(empresa: string | null | undefined): string[] {
  const slug = empresa ? logoSlug(empresa) : "";
  return slug ? ["png", "jpg", "jpeg"].map((ext) => `/logos-clientes/${slug}.${ext}`) : [];
}

export interface RespostaInput {
  pergunta: string;
  icone: string | null;
  resposta: string;
  comentario: string;
}

export interface InspecaoInput {
  clientId: string; // generated on the device: sending twice never creates two inspections
  modeloId: number | null;
  modeloNome: string;
  projectId: number;
  numero: string;
  revisao: string;
  contratada: string;
  subcontratada: string;
  local: string;
  grupo: string;
  frente: string;
  objeto: string;
  tag: string;
  periodicidade: string;
  inspetor: string;
  dataInspecao: string;
  nomeTecnico: string;
  nomeOperador: string;
  assinaturaTecnico: string | null;
  assinaturaOperador: string | null;
  respostas: RespostaInput[];
}

export const CAMPOS_TEXTO = [
  "numero",
  "revisao",
  "contratada",
  "subcontratada",
  "local",
  "grupo",
  "frente",
  "objeto",
  "tag",
  "periodicidade",
  "inspetor",
  "nomeTecnico",
  "nomeOperador",
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ASSINATURA_RE = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

function dataValida(iso: unknown): boolean {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso);
}

function assinaturaValida(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === "") return true;
  return typeof valor === "string" && valor.length <= CHECKLIST_ASSINATURA_MAX_LENGTH && ASSINATURA_RE.test(valor);
}

/** Only the structure is required: as in the original tool, the document fields may stay blank. */
export function validateInspecao(input: Partial<InspecaoInput>): string | null {
  if (typeof input.clientId !== "string" || !UUID_RE.test(input.clientId)) return "Identificador da inspeção inválido.";
  if (typeof input.modeloNome !== "string" || !input.modeloNome.trim() || input.modeloNome.length > TEXTO_MAX) return "Selecione o equipamento.";
  if (!Number.isInteger(input.projectId) || (input.projectId as number) <= 0) return "Selecione a obra.";
  if (!dataValida(input.dataInspecao)) return "Informe a data da inspeção.";
  for (const campo of CAMPOS_TEXTO) {
    const valor = input[campo];
    if (valor !== undefined && (typeof valor !== "string" || valor.length > TEXTO_MAX)) return "Um dos campos do documento é longo demais.";
  }
  if (!assinaturaValida(input.assinaturaTecnico) || !assinaturaValida(input.assinaturaOperador)) return "Assinatura inválida.";
  if (!Array.isArray(input.respostas) || !input.respostas.length || input.respostas.length > CHECKLIST_ITENS_MAX) return "O checklist não tem itens válidos.";
  for (const r of input.respostas) {
    if (!r || typeof r.pergunta !== "string" || !r.pergunta.trim() || r.pergunta.length > PERGUNTA_MAX) return "O checklist não tem itens válidos.";
    if (!(RESPOSTAS as readonly string[]).includes(r.resposta)) return "Resposta inválida em um dos itens.";
    if (typeof r.comentario !== "string" || r.comentario.length > COMENTARIO_MAX) return "Um dos comentários é longo demais.";
  }
  return null;
}
