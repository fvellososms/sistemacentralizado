import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { checklistFotos, checklistInspecoes, checklistModeloItens, checklistModelos, checklistRespostas } from "@/db/schema";
import type { ChecklistItem, RespostaInput } from "../domain/checklists";

export type InspecaoRow = typeof checklistInspecoes.$inferSelect;
export type InspecaoInsert = typeof checklistInspecoes.$inferInsert;
export type FotoRow = typeof checklistFotos.$inferSelect;

export interface ModeloResumo {
  id: number;
  nome: string;
  ativo: boolean;
  totalItens: number;
}

export interface InspecaoResumo {
  id: number;
  clientId: string;
  modeloNome: string;
  projectName: string | null;
  tag: string;
  inspetor: string;
  dataInspecao: string;
  conformes: number;
  naoConformes: number;
  naoAplica: number;
}

const HISTORICO_LIMITE = 200;
const contar = (resposta: string) => sql<number>`count(*) filter (where ${checklistRespostas.resposta} = ${resposta})::int`;

export const checklistRepository = {
  async listModelos(): Promise<ModeloResumo[]> {
    return db
      .select({ id: checklistModelos.id, nome: checklistModelos.nome, ativo: checklistModelos.ativo, totalItens: count(checklistModeloItens.id) })
      .from(checklistModelos)
      .leftJoin(checklistModeloItens, eq(checklistModeloItens.modeloId, checklistModelos.id))
      .groupBy(checklistModelos.id)
      .orderBy(asc(checklistModelos.nome));
  },

  async findModelo(id: number) {
    const [modelo] = await db.select().from(checklistModelos).where(eq(checklistModelos.id, id)).limit(1);
    if (!modelo) return null;
    const itens = await db
      .select({ pergunta: checklistModeloItens.pergunta, icone: checklistModeloItens.icone })
      .from(checklistModeloItens)
      .where(eq(checklistModeloItens.modeloId, id))
      .orderBy(asc(checklistModeloItens.ordem));
    return { ...modelo, itens };
  },

  /** Creates the template or replaces its questions. Past inspections keep their own copy. */
  async salvarModelo(nome: string, itens: ChecklistItem[]): Promise<ModeloResumo> {
    return db.transaction(async (tx) => {
      const [modelo] = await tx
        .insert(checklistModelos)
        .values({ nome })
        .onConflictDoUpdate({ target: checklistModelos.nome, set: { atualizadoEm: new Date() } })
        .returning();
      await tx.delete(checklistModeloItens).where(eq(checklistModeloItens.modeloId, modelo.id));
      await tx.insert(checklistModeloItens).values(itens.map((item, i) => ({ modeloId: modelo.id, ordem: i + 1, ...item })));
      return { id: modelo.id, nome: modelo.nome, ativo: modelo.ativo, totalItens: itens.length };
    });
  },

  async definirAtivo(id: number, ativo: boolean): Promise<boolean> {
    const linhas = await db.update(checklistModelos).set({ ativo, atualizadoEm: new Date() }).where(eq(checklistModelos.id, id)).returning({ id: checklistModelos.id });
    return linhas.length > 0;
  },

  async listInspecoes(projectId?: number): Promise<InspecaoResumo[]> {
    return db
      .select({
        id: checklistInspecoes.id,
        clientId: checklistInspecoes.clientId,
        modeloNome: checklistInspecoes.modeloNome,
        projectName: checklistInspecoes.projectName,
        tag: checklistInspecoes.tag,
        inspetor: checklistInspecoes.inspetor,
        dataInspecao: checklistInspecoes.dataInspecao,
        conformes: contar("Conforme"),
        naoConformes: contar("Não conforme"),
        naoAplica: contar("Não se aplica"),
      })
      .from(checklistInspecoes)
      .leftJoin(checklistRespostas, eq(checklistRespostas.inspecaoId, checklistInspecoes.id))
      .where(projectId ? eq(checklistInspecoes.projectId, projectId) : undefined)
      .groupBy(checklistInspecoes.id)
      .orderBy(desc(checklistInspecoes.dataInspecao), desc(checklistInspecoes.id))
      .limit(HISTORICO_LIMITE);
  },

  /** Saves once per device id: a repeated request returns the inspection already saved. */
  async criarInspecao(dados: InspecaoInsert, respostas: RespostaInput[]): Promise<InspecaoRow> {
    return db.transaction(async (tx) => {
      const [nova] = await tx.insert(checklistInspecoes).values(dados).onConflictDoNothing({ target: checklistInspecoes.clientId }).returning();
      if (!nova) {
        const [existente] = await tx.select().from(checklistInspecoes).where(eq(checklistInspecoes.clientId, dados.clientId)).limit(1);
        return existente;
      }
      await tx.insert(checklistRespostas).values(respostas.map((r, i) => ({ inspecaoId: nova.id, ordem: i + 1, ...r })));
      return nova;
    });
  },

  async findInspecao(id: number) {
    const [inspecao] = await db.select().from(checklistInspecoes).where(eq(checklistInspecoes.id, id)).limit(1);
    if (!inspecao) return null;
    const [respostas, fotos] = await Promise.all([
      db
        .select({ pergunta: checklistRespostas.pergunta, icone: checklistRespostas.icone, resposta: checklistRespostas.resposta, comentario: checklistRespostas.comentario })
        .from(checklistRespostas)
        .where(eq(checklistRespostas.inspecaoId, id))
        .orderBy(asc(checklistRespostas.ordem)),
      db.select().from(checklistFotos).where(eq(checklistFotos.inspecaoId, id)).orderBy(asc(checklistFotos.ordem)),
    ]);
    return { ...inspecao, respostas, fotos };
  },

  async salvarFoto(inspecaoId: number, ordem: number, caminho: string, tipo: string): Promise<void> {
    await db
      .insert(checklistFotos)
      .values({ inspecaoId, ordem, caminho, tipo })
      .onConflictDoUpdate({ target: [checklistFotos.inspecaoId, checklistFotos.ordem], set: { caminho, tipo } });
  },

  async findFoto(id: number): Promise<FotoRow | null> {
    const [foto] = await db.select().from(checklistFotos).where(eq(checklistFotos.id, id)).limit(1);
    return foto ?? null;
  },
};

export type ChecklistRepository = typeof checklistRepository;
