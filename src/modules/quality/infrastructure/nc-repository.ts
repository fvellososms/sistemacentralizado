import { db } from "@/db";
import { naoConformidades, ncAcoes, ncEventos } from "@/db/schema";
import { asc, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import type { NaoConformidadeInput } from "../domain/non-conformities";
import type { NcAcaoInput, NcEventoTipo } from "../domain/nc-workflow";

export type NaoConformidadeRow = typeof naoConformidades.$inferSelect;
export type NcAcaoRow = typeof ncAcoes.$inferSelect;
export type NcEventoRow = typeof ncEventos.$inferSelect;
/** List row: the photo (base64, up to a few MB) stays out of lists; `temFoto` tells whether there is one. */
export type NcListRow = Omit<NaoConformidadeRow, "fotoUrl"> & { temFoto: boolean };
export type NcUpdate = Partial<Omit<typeof naoConformidades.$inferInsert, "id" | "createdAt">>;

export interface NaoConformidadeRepository {
  findMany(filter?: { projectId?: number }): Promise<NcListRow[]>;
  findById(id: number): Promise<NaoConformidadeRow | null>;
  create(data: NaoConformidadeInput & { criadoPor?: string | null }): Promise<NaoConformidadeRow>;
  update(id: number, values: NcUpdate): Promise<NaoConformidadeRow | null>;
  markResolved(id: number): Promise<NaoConformidadeRow | null>;
  listAcoes(ncIds: number[]): Promise<NcAcaoRow[]>;
  /** Replaces the pending actions of the plan; concluded actions are never touched. */
  savePendingAcoes(ncId: number, acoes: NcAcaoInput[]): Promise<void>;
  concludeAcao(acaoId: number, evidencia: string, fotoUrl: string | null): Promise<NcAcaoRow | null>;
  listEventos(ncId: number): Promise<NcEventoRow[]>;
  addEvento(ncId: number, tipo: NcEventoTipo, descricao: string, autor: string | null): Promise<void>;
}

export class DrizzleNaoConformidadeRepository implements NaoConformidadeRepository {
  async findMany(filter?: { projectId?: number }): Promise<NcListRow[]> {
    try {
      const { fotoUrl: _foto, ...columns } = getTableColumns(naoConformidades);
      const query = db
        .select({ ...columns, temFoto: sql<boolean>`${naoConformidades.fotoUrl} is not null` })
        .from(naoConformidades)
        .$dynamic();
      if (filter?.projectId) query.where(eq(naoConformidades.projectId, filter.projectId));
      return await query.orderBy(desc(naoConformidades.dataOcorrencia), desc(naoConformidades.id));
    } catch (error) {
      console.warn("Falha ao listar não conformidades; retornando lista vazia:", error);
      return [];
    }
  }

  async findById(id: number): Promise<NaoConformidadeRow | null> {
    try {
      const [row] = await db.select().from(naoConformidades).where(eq(naoConformidades.id, id)).limit(1);
      return row ?? null;
    } catch (error) {
      console.warn("Falha ao buscar não conformidade:", error);
      return null;
    }
  }

  async create(data: NaoConformidadeInput & { criadoPor?: string | null }): Promise<NaoConformidadeRow> {
    const [row] = await db
      .insert(naoConformidades)
      .values({
        projectId: data.projectId,
        projectName: data.projectName?.trim() || null,
        tipo: data.tipo,
        grau: data.grau,
        dataOcorrencia: data.dataOcorrencia,
        localObra: data.localObra.trim(),
        requisitoViolado: data.requisitoViolado.trim(),
        titulo: data.titulo.trim(),
        descricao: data.descricao.trim(),
        responsavelNome: data.responsavelNome.trim(),
        responsavelEmail: data.responsavelEmail.trim().toLowerCase(),
        prazo: data.prazo,
        fotoUrl: data.fotoUrl || null,
        criadoPor: data.criadoPor ?? null,
      })
      .returning();
    return row;
  }

  async update(id: number, values: NcUpdate): Promise<NaoConformidadeRow | null> {
    const [row] = await db
      .update(naoConformidades)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(naoConformidades.id, id))
      .returning();
    return row ?? null;
  }

  /** Legacy direct closing (PATCH { status: "resolvida" }). */
  async markResolved(id: number): Promise<NaoConformidadeRow | null> {
    const now = new Date();
    return this.update(id, { status: "encerrada", resolvidaEm: now, encerradaEm: now });
  }

  async listAcoes(ncIds: number[]): Promise<NcAcaoRow[]> {
    if (!ncIds.length) return [];
    try {
      return await db.select().from(ncAcoes).where(inArray(ncAcoes.ncId, ncIds)).orderBy(asc(ncAcoes.ordem), asc(ncAcoes.id));
    } catch (error) {
      console.warn("Falha ao listar ações das NCs; retornando lista vazia:", error);
      return [];
    }
  }

  async savePendingAcoes(ncId: number, acoes: NcAcaoInput[]): Promise<void> {
    await db.transaction(async (tx) => {
      const existing = await tx.select().from(ncAcoes).where(eq(ncAcoes.ncId, ncId));
      const concluded = existing.filter((a) => a.status === "concluida");
      const pending = new Map(existing.filter((a) => a.status !== "concluida").map((a) => [a.id, a]));
      const kept = new Set<number>();
      let ordem = concluded.length;

      for (const a of acoes) {
        const values = {
          oQue: a.oQue.trim(),
          porQue: a.porQue.trim(),
          onde: a.onde?.trim() || null,
          quem: a.quem.trim(),
          quando: a.quando,
          como: a.como.trim(),
          quanto: a.quanto?.trim() || null,
          ordem: ordem++,
          updatedAt: new Date(),
        };
        if (a.id && pending.has(a.id)) {
          kept.add(a.id);
          await tx.update(ncAcoes).set(values).where(eq(ncAcoes.id, a.id));
        } else if (!a.id || !concluded.some((c) => c.id === a.id)) {
          await tx.insert(ncAcoes).values({ ...values, ncId });
        }
      }
      const removed = [...pending.keys()].filter((id) => !kept.has(id));
      if (removed.length) await tx.delete(ncAcoes).where(inArray(ncAcoes.id, removed));
    });
  }

  async concludeAcao(acaoId: number, evidencia: string, fotoUrl: string | null): Promise<NcAcaoRow | null> {
    const now = new Date();
    const [row] = await db
      .update(ncAcoes)
      .set({ status: "concluida", concluidaEm: now, evidencia, evidenciaFotoUrl: fotoUrl, updatedAt: now })
      .where(eq(ncAcoes.id, acaoId))
      .returning();
    return row ?? null;
  }

  async listEventos(ncId: number): Promise<NcEventoRow[]> {
    try {
      return await db.select().from(ncEventos).where(eq(ncEventos.ncId, ncId)).orderBy(asc(ncEventos.createdAt), asc(ncEventos.id));
    } catch (error) {
      console.warn("Falha ao listar histórico da NC; retornando lista vazia:", error);
      return [];
    }
  }

  async addEvento(ncId: number, tipo: NcEventoTipo, descricao: string, autor: string | null): Promise<void> {
    await db.insert(ncEventos).values({ ncId, tipo, descricao, autor });
  }
}

export const defaultNaoConformidadeRepository = new DrizzleNaoConformidadeRepository();
