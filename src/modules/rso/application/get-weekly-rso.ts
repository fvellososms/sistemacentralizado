import { db } from "@/db";
import { rdos, rdoContractors, rdoActivities, rdoOccurrences, rdoPhotos, projects } from "@/db/schema";
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm";
import { calculateRsoSummary } from "../domain/calculations";
import type { RsoReport } from "../domain/types";
import { STATIC_PROJECTS } from "@/modules/projects";
import {
  listRawFallbackRdos,
  isRdoDbRecentlyDown,
  markRdoDbDown,
} from "@/modules/rdo/infrastructure/rdo-fallback-store";

export interface GetWeeklyRsoParams {
  projectId: number;
  startDate?: string | null;
  endDate?: string | null;
}

function buildFallbackWeeklyRso(params: GetWeeklyRsoParams): RsoReport {
  const { projectId, startDate, endDate } = params;
  const staticProject = STATIC_PROJECTS.find((p) => p.id === projectId) ?? null;
  const fallbackList = listRawFallbackRdos({
    projectId,
    startDate,
    endDate,
  });

  const allContractors = fallbackList.flatMap((r) => r.contractors ?? []);
  const allActivities = fallbackList.flatMap((r) => r.activities ?? []);
  const allOccurrences = fallbackList.flatMap((r) => r.occurrences ?? []);
  const allPhotos = fallbackList.flatMap((r) => r.photos ?? []);
  const summary = calculateRsoSummary(fallbackList, allOccurrences.length);

  return {
    project: staticProject,
    period: { startDate, endDate },
    summary,
    rdos: fallbackList,
    contractors: allContractors,
    activities: allActivities,
    occurrences: allOccurrences,
    photos: allPhotos,
  };
}

export async function getWeeklyRso(params: GetWeeklyRsoParams): Promise<RsoReport> {
  const { projectId, startDate, endDate } = params;

  if (isRdoDbRecentlyDown()) {
    return buildFallbackWeeklyRso(params);
  }

  try {
    const projectResult = await db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        companyName: projects.companyName,
        address: projects.address,
        managerName: projects.managerName,
        status: projects.status,
        startDate: projects.startDate,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .catch(() => []);
    const project = projectResult[0] || STATIC_PROJECTS.find((p) => p.id === projectId) || null;

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
        db.select().from(rdoContractors).where(inArray(rdoContractors.rdoId, rdoIds)),
        db.select().from(rdoActivities).where(inArray(rdoActivities.rdoId, rdoIds)),
        db.select().from(rdoOccurrences).where(inArray(rdoOccurrences.rdoId, rdoIds)),
        db.select().from(rdoPhotos).where(inArray(rdoPhotos.rdoId, rdoIds)),
      ]);

      allContractors = cList;
      allActivities = aList;
      allOccurrences = oList;
      allPhotos = pList;
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
    markRdoDbDown();
    console.warn("getWeeklyRso: database unavailable, returning fallback report:", error);
    return buildFallbackWeeklyRso(params);
  }
}

