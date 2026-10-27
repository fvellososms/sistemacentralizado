import { db } from "@/db";
import { apr, aprAtividade, aprRisco, obras } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import {
  calculateRiskDistribution,
  type RiskCategoryDistribution,
} from "../domain/risk-distribution";

export interface GetRiskDistributionFilters {
  obraId?: number;
  codigo?: string;
  nome?: string;
}

/**
 * Application use case: fetches risks registered in APRs for the given obra/project,
 * and calculates the 3-category distribution.
 */
export async function getRiskDistribution(
  filters?: GetRiskDistributionFilters
): Promise<RiskCategoryDistribution[]> {
  try {
    const conditions = [];

    if (filters?.obraId) {
      conditions.push(eq(apr.obraId, filters.obraId));
    }

    if (filters?.codigo || filters?.nome) {
      const obraConds = [];
      if (filters.codigo) obraConds.push(eq(obras.codigo, filters.codigo));
      if (filters.nome) obraConds.push(eq(obras.nome, filters.nome));

      const matchedObras = await db
        .select({ id: obras.id })
        .from(obras)
        .where(obraConds.length > 1 ? or(...obraConds) : obraConds[0]);

      if (matchedObras.length > 0) {
        const obraIds = matchedObras.map((o) => o.id);
        if (!filters.obraId) {
          conditions.push(
            obraIds.length === 1
              ? eq(apr.obraId, obraIds[0])
              : or(...obraIds.map((id) => eq(apr.obraId, id)))
          );
        }
      }
    }

    const query = db
      .select({
        probabilidade: aprRisco.probabilidade,
        severidade: aprRisco.severidade,
      })
      .from(aprRisco)
      .innerJoin(aprAtividade, eq(aprAtividade.id, aprRisco.aprAtividadeId))
      .innerJoin(apr, eq(apr.id, aprAtividade.aprId));

    const rows = conditions.length
      ? await query.where(conditions.length > 1 ? and(...conditions) : conditions[0])
      : await query;

    return calculateRiskDistribution(rows);
  } catch (err) {
    console.warn("getRiskDistribution failed or database unavailable:", err);
    return calculateRiskDistribution([]);
  }
}

