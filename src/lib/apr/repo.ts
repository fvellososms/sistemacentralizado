import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  apr,
  aprAtividade,
  aprControle,
  aprRisco,
  atividadeRisco,
  atividadeTermos,
  atividades,
  medidasControle,
  nrs,
  obras,
  riscoControle,
  riscoNr,
  riscos,
  usuarios,
} from "@/db/schema";
import type { AtividadeIndexada } from "./search";
import { isProbabilidade, isSeveridade } from "./risco";
import type { AprDraft, AprStatus, AtividadeDraft, RiscoBase, TipoControle } from "./types";

// ---------------------------------------------------------------------------
// Base de conhecimento
// ---------------------------------------------------------------------------
export async function indiceAtividades(): Promise<AtividadeIndexada[]> {
  const rows = await db
    .select({
      id: atividades.id,
      nome: atividades.nome,
      categoria: atividades.categoria,
      descricao: atividades.descricao,
    })
    .from(atividades)
    .where(eq(atividades.ativo, true));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [termos, contagem] = await Promise.all([
    db.select().from(atividadeTermos).where(inArray(atividadeTermos.atividadeId, ids)),
    db
      .select({ atividadeId: atividadeRisco.atividadeId, qtd: sql<number>`count(*)::int` })
      .from(atividadeRisco)
      .where(inArray(atividadeRisco.atividadeId, ids))
      .groupBy(atividadeRisco.atividadeId),
  ]);
  const termosPor = new Map<number, string[]>();
  for (const t of termos) termosPor.set(t.atividadeId, [...(termosPor.get(t.atividadeId) ?? []), t.termo]);
  const qtdPor = new Map(contagem.map((c) => [c.atividadeId, Number(c.qtd)]));
  return rows.map((r) => ({
    ...r,
    termos: termosPor.get(r.id) ?? [],
    qtdRiscos: qtdPor.get(r.id) ?? 0,
  }));
}

export async function riscosDaAtividade(atividadeId: number): Promise<RiscoBase[]> {
  const rel = await db
    .select({
      riscoId: riscos.id,
      nome: riscos.nome,
      descricao: riscos.descricao,
      probabilidade: atividadeRisco.probabilidade,
      severidade: atividadeRisco.severidade,
    })
    .from(atividadeRisco)
    .innerJoin(riscos, eq(riscos.id, atividadeRisco.riscoId))
    .where(and(eq(atividadeRisco.atividadeId, atividadeId), eq(riscos.ativo, true)))
    .orderBy(asc(riscos.nome));
  return montarRiscosBase(rel);
}

export async function riscoBasePorId(riscoId: number): Promise<RiscoBase | null> {
  const rel = await db
    .select({
      riscoId: riscos.id,
      nome: riscos.nome,
      descricao: riscos.descricao,
      probabilidade: sql<string>`'media'`,
      severidade: sql<string>`'moderada'`,
    })
    .from(riscos)
    .where(and(eq(riscos.id, riscoId), eq(riscos.ativo, true)));
  const r = await montarRiscosBase(rel);
  return r[0] ?? null;
}

async function montarRiscosBase(
  rel: { riscoId: number; nome: string; descricao: string | null; probabilidade: string; severidade: string }[],
): Promise<RiscoBase[]> {
  if (rel.length === 0) return [];
  const ids = rel.map((r) => r.riscoId);
  const [nrRows, ctrlRows] = await Promise.all([
    db
      .select({ riscoId: riscoNr.riscoId, codigo: nrs.codigo })
      .from(riscoNr)
      .innerJoin(nrs, eq(nrs.id, riscoNr.nrId))
      .where(inArray(riscoNr.riscoId, ids))
      .orderBy(asc(nrs.codigo)),
    db
      .select({
        riscoId: riscoControle.riscoId,
        id: medidasControle.id,
        nome: medidasControle.nome,
        descricao: medidasControle.descricao,
        tipoControle: medidasControle.tipoControle,
        obrigatorio: riscoControle.obrigatorio,
      })
      .from(riscoControle)
      .innerJoin(medidasControle, eq(medidasControle.id, riscoControle.controleId))
      .where(and(inArray(riscoControle.riscoId, ids), eq(medidasControle.ativo, true))),
  ]);
  return rel.map((r) => ({
    id: r.riscoId,
    nome: r.nome,
    descricao: r.descricao,
    probabilidade: isProbabilidade(r.probabilidade) ? r.probabilidade : "media",
    severidade: isSeveridade(r.severidade) ? r.severidade : "moderada",
    nrs: nrRows.filter((n) => n.riscoId === r.riscoId).map((n) => n.codigo),
    controles: ctrlRows
      .filter((c) => c.riscoId === r.riscoId)
      .map(({ riscoId: _r, ...c }) => c),
  }));
}

// ---------------------------------------------------------------------------
// APR – listagem e leitura
// ---------------------------------------------------------------------------
export interface FiltrosApr {
  obraId?: number;
  status?: AprStatus;
  atividade?: string;
  de?: string;
  ate?: string;
  q?: string;
}

export async function listarAprs(f: FiltrosApr) {
  const cond = [];
  if (f.obraId) cond.push(eq(apr.obraId, f.obraId));
  if (f.status) cond.push(eq(apr.status, f.status));
  if (f.de) cond.push(gte(apr.criadoEm, new Date(f.de)));
  if (f.ate) cond.push(lte(apr.criadoEm, new Date(f.ate + "T23:59:59")));
  if (f.q) cond.push(or(ilike(apr.descricaoServico, `%${f.q}%`), ilike(apr.localObra, `%${f.q}%`), ilike(apr.codigo, `%${f.q}%`)));
  if (f.atividade) {
    const sub = db
      .select({ aprId: aprAtividade.aprId })
      .from(aprAtividade)
      .where(ilike(aprAtividade.atividadeNomeSnapshot, `%${f.atividade}%`));
    cond.push(inArray(apr.id, sub));
  }

  const rows = await db
    .select({
      id: apr.id,
      codigo: apr.codigo,
      localObra: apr.localObra,
      descricaoServico: apr.descricaoServico,
      status: apr.status,
      etapaAtual: apr.etapaAtual,
      dataExecucao: apr.dataExecucao,
      criadoEm: apr.criadoEm,
      atualizadoEm: apr.atualizadoEm,
      obraNome: obras.nome,
      obraCodigo: obras.codigo,
      autor: usuarios.nome,
      qtdAtividades: sql<number>`(select count(*)::int from apr_atividade aa where aa.apr_id = ${apr.id})`,
      qtdRiscos: sql<number>`(select count(*)::int from apr_risco ar join apr_atividade aa on aa.id = ar.apr_atividade_id where aa.apr_id = ${apr.id})`,
    })
    .from(apr)
    .leftJoin(obras, eq(obras.id, apr.obraId))
    .leftJoin(usuarios, eq(usuarios.id, apr.criadoPor))
    .where(cond.length ? and(...cond) : undefined)
    .orderBy(desc(apr.atualizadoEm))
    .limit(200);
  return rows;
}

export interface AprCompleta extends AprDraft {
  id: number;
  codigo: string;
  obraNome: string | null;
  obraCodigo: string | null;
  autorNome: string | null;
  autorId: number | null;
  aprovadorNome: string | null;
  criadoEm: string;
  atualizadoEm: string;
  submetidoEm: string | null;
  aprovadoEm: string | null;
}

export async function carregarApr(id: number): Promise<AprCompleta | null> {
  const [a] = await db
    .select({
      apr,
      obraNome: obras.nome,
      obraCodigo: obras.codigo,
      autorNome: usuarios.nome,
    })
    .from(apr)
    .leftJoin(obras, eq(obras.id, apr.obraId))
    .leftJoin(usuarios, eq(usuarios.id, apr.criadoPor))
    .where(eq(apr.id, id));
  if (!a) return null;

  let aprovadorNome: string | null = null;
  if (a.apr.aprovadoPor) {
    const [u] = await db.select({ nome: usuarios.nome }).from(usuarios).where(eq(usuarios.id, a.apr.aprovadoPor));
    aprovadorNome = u?.nome ?? null;
  }

  const atvs = await db.select().from(aprAtividade).where(eq(aprAtividade.aprId, id)).orderBy(asc(aprAtividade.ordem), asc(aprAtividade.id));
  const atvIds = atvs.map((x) => x.id);
  const rs = atvIds.length
    ? await db.select().from(aprRisco).where(inArray(aprRisco.aprAtividadeId, atvIds)).orderBy(asc(aprRisco.id))
    : [];
  const rIds = rs.map((x) => x.id);
  const cs = rIds.length
    ? await db.select().from(aprControle).where(inArray(aprControle.aprRiscoId, rIds)).orderBy(asc(aprControle.id))
    : [];

  const atividadesDraft: AtividadeDraft[] = atvs.map((at) => ({
    key: `a${at.id}`,
    nome: at.atividadeNomeSnapshot,
    categoria: at.atividadeCategoriaSnapshot,
    atividadeOrigemId: at.atividadeOrigemId,
    origem: at.origem,
    riscos: rs
      .filter((r) => r.aprAtividadeId === at.id)
      .map((r) => ({
        key: `r${r.id}`,
        nome: r.riscoNomeSnapshot,
        nrs: r.nrsSnapshot ? r.nrsSnapshot.split(",").map((s) => s.trim()).filter(Boolean) : [],
        probabilidade: isProbabilidade(r.probabilidade) ? r.probabilidade : "media",
        severidade: isSeveridade(r.severidade) ? r.severidade : "moderada",
        selecionado: true,
        revisado: r.revisado,
        riscoOrigemId: r.riscoOrigemId,
        origem: r.origem,
        controles: cs
          .filter((c) => c.aprRiscoId === r.id)
          .map((c) => ({
            key: `c${c.id}`,
            nome: c.controleNomeSnapshot,
            tipoControle: c.tipoControleSnapshot,
            obrigatorio: c.obrigatorio,
            selecionado: c.selecionado,
            justificativa: c.justificativa ?? undefined,
            controleOrigemId: c.controleOrigemId,
            origem: c.origem,
          })),
      })),
  }));

  return {
    id: a.apr.id,
    codigo: a.apr.codigo,
    status: a.apr.status,
    obraId: a.apr.obraId,
    localObra: a.apr.localObra,
    responsavel: a.apr.responsavel,
    equipe: a.apr.equipe ?? "",
    dataExecucao: a.apr.dataExecucao ?? "",
    descricaoServico: a.apr.descricaoServico,
    etapaAtual: a.apr.etapaAtual,
    revisadaPeloAutor: a.apr.revisadaPeloAutor,
    motivoReprovacao: a.apr.motivoReprovacao,
    atividades: atividadesDraft,
    obraNome: a.obraNome,
    obraCodigo: a.obraCodigo,
    autorNome: a.autorNome,
    autorId: a.apr.criadoPor,
    aprovadorNome,
    criadoEm: a.apr.criadoEm.toISOString(),
    atualizadoEm: a.apr.atualizadoEm.toISOString(),
    submetidoEm: a.apr.submetidoEm?.toISOString() ?? null,
    aprovadoEm: a.apr.aprovadoEm?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// APR – gravação (rascunho) com snapshot dos itens
// ---------------------------------------------------------------------------
async function gerarCodigo(): Promise<string> {
  const ano = new Date().getFullYear();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apr)
    .where(ilike(apr.codigo, `APR-${ano}-%`));
  return `APR-${ano}-${String(Number(count) + 1).padStart(4, "0")}`;
}

export async function salvarApr(draft: AprDraft, usuarioId: number): Promise<number> {
  return db.transaction(async (tx) => {
    let id = draft.id;
    const base = {
      obraId: draft.obraId,
      localObra: draft.localObra.trim(),
      responsavel: draft.responsavel.trim(),
      equipe: draft.equipe?.trim() || null,
      dataExecucao: draft.dataExecucao || null,
      descricaoServico: draft.descricaoServico.trim(),
      etapaAtual: draft.etapaAtual,
      revisadaPeloAutor: draft.revisadaPeloAutor,
      atualizadoEm: new Date(),
    };

    if (id) {
      const [existente] = await tx.select({ status: apr.status }).from(apr).where(eq(apr.id, id));
      if (!existente) throw new Error("APR não encontrada");
      if (existente.status === "aprovada" || existente.status === "aguardando_aprovacao") {
        throw new Error("Esta APR não pode mais ser editada.");
      }
      // Ao editar uma APR devolvida, ela volta a rascunho
      await tx.update(apr).set({ ...base, status: "rascunho" }).where(eq(apr.id, id));
      await tx.delete(aprAtividade).where(eq(aprAtividade.aprId, id));
    } else {
      let codigo = await gerarCodigo();
      for (let i = 0; i < 3; i++) {
        const [dup] = await tx.select({ id: apr.id }).from(apr).where(eq(apr.codigo, codigo));
        if (!dup) break;
        codigo = codigo.replace(/(\d+)$/, (m) => String(Number(m) + 1).padStart(4, "0"));
      }
      const [novo] = await tx
        .insert(apr)
        .values({ ...base, codigo, status: "rascunho", criadoPor: usuarioId })
        .returning({ id: apr.id });
      id = novo.id;
    }

    let ordem = 0;
    for (const at of draft.atividades) {
      const [aa] = await tx
        .insert(aprAtividade)
        .values({
          aprId: id,
          ordem: ordem++,
          atividadeNomeSnapshot: at.nome.trim(),
          atividadeCategoriaSnapshot: at.categoria,
          atividadeOrigemId: at.atividadeOrigemId,
          origem: at.origem,
        })
        .returning({ id: aprAtividade.id });
      for (const r of at.riscos) {
        if (!r.selecionado) continue;
        const [ar] = await tx
          .insert(aprRisco)
          .values({
            aprAtividadeId: aa.id,
            riscoNomeSnapshot: r.nome.trim(),
            nrsSnapshot: r.nrs.join(", ") || null,
            probabilidade: r.probabilidade,
            severidade: r.severidade,
            revisado: r.revisado,
            riscoOrigemId: r.riscoOrigemId,
            origem: r.origem,
          })
          .returning({ id: aprRisco.id });
        if (r.controles.length) {
          await tx.insert(aprControle).values(
            r.controles.map((c) => ({
              aprRiscoId: ar.id,
              controleNomeSnapshot: c.nome.trim(),
              tipoControleSnapshot: c.tipoControle as TipoControle,
              obrigatorio: c.obrigatorio,
              selecionado: c.selecionado,
              justificativa: c.justificativa?.trim() || null,
              controleOrigemId: c.controleOrigemId,
              origem: c.origem,
            })),
          );
        }
      }
    }
    return id;
  });
}

// ---------------------------------------------------------------------------
// Transições de estado
// ---------------------------------------------------------------------------
export async function submeterApr(id: number) {
  const [a] = await db.select().from(apr).where(eq(apr.id, id));
  if (!a) throw new Error("APR não encontrada");
  if (a.status !== "rascunho" && a.status !== "reprovada") throw new Error("Somente rascunhos podem ser enviados para aprovação.");
  if (!a.revisadaPeloAutor) throw new Error("Revise todos os itens antes de enviar para aprovação.");
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(aprAtividade).where(eq(aprAtividade.aprId, id));
  if (Number(count) === 0) throw new Error("A APR precisa ter ao menos uma atividade.");
  await db
    .update(apr)
    .set({ status: "aguardando_aprovacao", submetidoEm: new Date(), atualizadoEm: new Date(), motivoReprovacao: null })
    .where(eq(apr.id, id));
}

export async function aprovarApr(id: number, aprovadorId: number) {
  const [a] = await db.select().from(apr).where(eq(apr.id, id));
  if (!a) throw new Error("APR não encontrada");
  if (a.status !== "aguardando_aprovacao") throw new Error("Somente APRs aguardando aprovação podem ser aprovadas.");
  await db
    .update(apr)
    .set({ status: "aprovada", aprovadoPor: aprovadorId, aprovadoEm: new Date(), atualizadoEm: new Date() })
    .where(eq(apr.id, id));
}

export async function reprovarApr(id: number, aprovadorId: number, motivo: string) {
  const [a] = await db.select().from(apr).where(eq(apr.id, id));
  if (!a) throw new Error("APR não encontrada");
  if (a.status !== "aguardando_aprovacao") throw new Error("Somente APRs aguardando aprovação podem ser reprovadas.");
  if (!motivo.trim()) throw new Error("Informe o motivo da reprovação.");
  await db
    .update(apr)
    .set({
      status: "reprovada",
      aprovadoPor: aprovadorId,
      motivoReprovacao: motivo.trim(),
      revisadaPeloAutor: false,
      atualizadoEm: new Date(),
    })
    .where(eq(apr.id, id));
}
