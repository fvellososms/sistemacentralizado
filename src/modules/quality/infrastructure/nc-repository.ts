import { db } from "@/db";
import { naoConformidades } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { NaoConformidadeInput } from "../domain/non-conformities";

export type NaoConformidadeRow = typeof naoConformidades.$inferSelect;

export interface NaoConformidadeRepository {
  findMany(filter?: { projectId?: number }): Promise<NaoConformidadeRow[]>;
  findById(id: number): Promise<NaoConformidadeRow | null>;
  create(data: NaoConformidadeInput): Promise<NaoConformidadeRow>;
  markResolved(id: number): Promise<NaoConformidadeRow | null>;
}

export class DrizzleNaoConformidadeRepository implements NaoConformidadeRepository {
  async findMany(filter?: { projectId?: number }): Promise<NaoConformidadeRow[]> {
    try {
      const query = db.select().from(naoConformidades).$dynamic();
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

  async create(data: NaoConformidadeInput): Promise<NaoConformidadeRow> {
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
      })
      .returning();
    return row;
  }

  async markResolved(id: number): Promise<NaoConformidadeRow | null> {
    const now = new Date();
    const [row] = await db
      .update(naoConformidades)
      .set({ status: "resolvida", resolvidaEm: now, updatedAt: now })
      .where(eq(naoConformidades.id, id))
      .returning();
    return row ?? null;
  }
}

export const defaultNaoConformidadeRepository = new DrizzleNaoConformidadeRepository();
