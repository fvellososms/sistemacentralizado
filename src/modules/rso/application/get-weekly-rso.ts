import { db } from "@/db";
import { rdos, rdoContractors, rdoActivities, rdoOccurrences, rdoPhotos, projects } from "@/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { calculateRsoSummary } from "../domain/calculations";
import type { RsoReport } from "../domain/types";

export interface GetWeeklyRsoParams {
  projectId: number;
  startDate?: string | null;
  endDate?: string | null;
}

export async function getWeeklyRso(params: GetWeeklyRsoParams): Promise<RsoReport> {
  const { projectId, startDate, endDate } = params;

  try {
    const projectResult = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const project = projectResult[0] || null;

    const conditions = [eq(rdos.projectId, projectId)];
    if (startDate && endDate) {
      conditions.push(gte(rdos.date, startDate));
      conditions.push(lte(rdos.date, endDate));
    }

    const rdoList = await db
      .select()
      .from(rdos)
      .where(and(...conditions))
      .orderBy(asc(rdos.date));

    const rdoIds = rdoList.map((r) => r.id);

    let allContractors: any[] = [];
    let allActivities: any[] = [];
    let allOccurrences: any[] = [];
    let allPhotos: any[] = [];

    if (rdoIds.length > 0) {
      const [cList, aList, oList, pList] = await Promise.all([
        db.select().from(rdoContractors),
        db.select().from(rdoActivities),
        db.select().from(rdoOccurrences),
        db.select().from(rdoPhotos),
      ]);

      allContractors = cList.filter((c) => rdoIds.includes(c.rdoId));
      allActivities = aList.filter((a) => rdoIds.includes(a.rdoId));
      allOccurrences = oList.filter((o) => rdoIds.includes(o.rdoId));
      allPhotos = pList.filter((p) => rdoIds.includes(p.rdoId));
    }

    const summary = calculateRsoSummary(rdoList, allOccurrences.length);

    return {
      project,
      period: { startDate, endDate },
      summary,
      rdos: rdoList,
      contractors: allContractors,
      activities: allActivities,
      occurrences: allOccurrences,
      photos: allPhotos,
    };
  } catch (error) {
    console.warn("getWeeklyRso: database unavailable, returning fallback report:", error);
    const summary = calculateRsoSummary([], 0);
    return {
      project: null,
      period: { startDate, endDate },
      summary,
      rdos: [],
      contractors: [],
      activities: [],
      occurrences: [],
      photos: [],
    };
  }
}

