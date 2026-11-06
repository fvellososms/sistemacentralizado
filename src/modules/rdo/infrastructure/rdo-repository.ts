import { db } from "@/db";
import {
  projects,
  rdos,
  rdoContractors,
  rdoActivities,
  rdoNonConformities,
  rdoOccurrences,
  rdoPhotos,
} from "@/db/schema";
import { eq, desc, and, like, inArray } from "drizzle-orm";
import { STATIC_PROJECTS } from "@/modules/projects";
import { isDatabaseUnavailableError } from "@/shared/errors/database-errors";
import type { CreateRdoInput } from "../domain/types";
import {
  createFallbackRdo,
  deleteFallbackPhoto,
  deleteFallbackRdo,
  findFallbackRdoById,
  getNextFallbackRdoNumber,
  isRdoDbRecentlyDown,
  listFallbackRdos,
  markRdoDbDown,
  updateFallbackRdo,
} from "./rdo-fallback-store";

export interface RdoRepository {
  findMany(filter?: { projectId?: number; month?: string }): Promise<any[]>;
  findById(id: number): Promise<any | null>;
  getNextRdoNumber(projectId: number): Promise<number>;
  create(
    data: CreateRdoInput & {
      rdoNumber: number;
      dayOfWeek: string;
      totalHh: string;
      totalHeadcount: number;
      contractorTeamCount: number;
      ownTeamCount: number;
    }
  ): Promise<any>;
  update(id: number, data: any): Promise<any | null>;
  delete(id: number): Promise<boolean>;
  deletePhoto(id: number): Promise<boolean>;
}

export class DrizzleRdoRepository implements RdoRepository {
  async findMany(filter?: { projectId?: number; month?: string }): Promise<any[]> {
    if (isRdoDbRecentlyDown()) {
      return listFallbackRdos(filter);
    }

    try {
      let query = db
        .select({
          id: rdos.id,
          projectId: rdos.projectId,
          rdoNumber: rdos.rdoNumber,
          date: rdos.date,
          dayOfWeek: rdos.dayOfWeek,
          dayStatus: rdos.dayStatus,
          workCondition: rdos.workCondition,
          workConditionMorning: rdos.workConditionMorning,
          workConditionAfternoon: rdos.workConditionAfternoon,
          weatherMorning: rdos.weatherMorning,
          weatherAfternoon: rdos.weatherAfternoon,
          ownTeamCount: rdos.ownTeamCount,
          contractorTeamCount: rdos.contractorTeamCount,
          totalHeadcount: rdos.totalHeadcount,
          totalHh: rdos.totalHh,
          hasOccurrences: rdos.hasOccurrences,
          observations: rdos.observations,
          authorName: rdos.authorName,
          status: rdos.status,
          createdAt: rdos.createdAt,
        })
        .from(rdos)
        .$dynamic();

      const conditions = [];

      if (filter?.projectId) {
        conditions.push(eq(rdos.projectId, filter.projectId));
      }

      if (filter?.month) {
        conditions.push(like(rdos.date, `${filter.month}%`));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rdoList = await query.orderBy(desc(rdos.date), desc(rdos.id));
      if (rdoList.length === 0) {
        return [];
      }

      const rdoIds = rdoList.map((r) => r.id);

      const [allActs, allOccs, allContractors, allPhotosMeta, allNonConfs] = await Promise.all([
        db
          .select({
            rdoId: rdoActivities.rdoId,
            description: rdoActivities.description,
          })
          .from(rdoActivities)
          .where(inArray(rdoActivities.rdoId, rdoIds)),
        db
          .select({
            rdoId: rdoOccurrences.rdoId,
          })
          .from(rdoOccurrences)
          .where(inArray(rdoOccurrences.rdoId, rdoIds)),
        db
          .select()
          .from(rdoContractors)
          .where(inArray(rdoContractors.rdoId, rdoIds)),
        db
          .select({
            id: rdoPhotos.id,
            rdoId: rdoPhotos.rdoId,
          })
          .from(rdoPhotos)
          .where(inArray(rdoPhotos.rdoId, rdoIds)),
        db
          .select()
          .from(rdoNonConformities)
          .where(inArray(rdoNonConformities.rdoId, rdoIds)),
      ]);

      const actsByRdo = new Map<number, string[]>();
      for (const a of allActs) {
        const list = actsByRdo.get(a.rdoId) ?? [];
        list.push(a.description);
        actsByRdo.set(a.rdoId, list);
      }

      const occCountByRdo = new Map<number, number>();
      for (const o of allOccs) {
        occCountByRdo.set(o.rdoId, (occCountByRdo.get(o.rdoId) ?? 0) + 1);
      }

      const contractorsByRdo = new Map<number, (typeof allContractors)[number][]>();
      for (const c of allContractors) {
        const list = contractorsByRdo.get(c.rdoId) ?? [];
        list.push(c);
        contractorsByRdo.set(c.rdoId, list);
      }

      const photoCountByRdo = new Map<number, number>();
      for (const p of allPhotosMeta) {
        photoCountByRdo.set(p.rdoId, (photoCountByRdo.get(p.rdoId) ?? 0) + 1);
      }

      const nonConfsByRdo = new Map<number, (typeof allNonConfs)[number][]>();
      for (const nc of allNonConfs) {
        const list = nonConfsByRdo.get(nc.rdoId) ?? [];
        list.push(nc);
        nonConfsByRdo.set(nc.rdoId, list);
      }

      return rdoList.map((rdo) => {
        const acts = actsByRdo.get(rdo.id) ?? [];
        return {
          ...rdo,
          activitiesCount: acts.length,
          activitiesSummary: acts.join("; "),
          contractorsList: contractorsByRdo.get(rdo.id) ?? [],
          occurrencesCount: occCountByRdo.get(rdo.id) ?? 0,
          nonConformitiesList: nonConfsByRdo.get(rdo.id) ?? [],
          photosCount: photoCountByRdo.get(rdo.id) ?? 0,
          photosPreview: [],
        };
      });
    } catch (e) {
      markRdoDbDown();
      console.warn("DrizzleRdoRepository.findMany: Database unavailable, returning fallback list.");
      return listFallbackRdos(filter);
    }
  }

  async findById(id: number): Promise<any | null> {
    if (isRdoDbRecentlyDown()) {
      return findFallbackRdoById(id);
    }

    try {
      const results = await db.select().from(rdos).where(eq(rdos.id, id)).limit(1);
      if (!results.length) {
        return findFallbackRdoById(id);
      }
      const rdo = results[0];

      const [projectResult, acts, occs, nonConfs, contractors, photosList] = await Promise.all([
        db
          .select({
            id: projects.id,
            name: projects.name,
            code: projects.code,
            companyName: projects.companyName,
            address: projects.address,
            managerName: projects.managerName,
            status: projects.status,
            startDate: projects.startDate,
          })
          .from(projects)
          .where(eq(projects.id, rdo.projectId))
          .limit(1)
          .catch(() => []),
        db.select().from(rdoActivities).where(eq(rdoActivities.rdoId, id)),
        db
          .select()
          .from(rdoOccurrences)
          .where(eq(rdoOccurrences.rdoId, id))
          .orderBy(rdoOccurrences.orderIndex),
        db.select().from(rdoNonConformities).where(eq(rdoNonConformities.rdoId, id)),
        db.select().from(rdoContractors).where(eq(rdoContractors.rdoId, id)),
        db.select().from(rdoPhotos).where(eq(rdoPhotos.rdoId, id)),
      ]);

      const project =
        projectResult[0] ??
        STATIC_PROJECTS.find((p) => p.id === rdo.projectId) ??
        null;

      return {
        ...rdo,
        project,
        activities: acts,
        occurrences: occs,
        nonConformities: nonConfs,
        contractors,
        photos: photosList,
      };
    } catch (e) {
      if (isDatabaseUnavailableError(e)) {
        markRdoDbDown();
      }
      console.warn("DrizzleRdoRepository.findById: Database unavailable, returning fallback RDO.", e);
      return findFallbackRdoById(id);
    }
  }

  async getNextRdoNumber(projectId: number): Promise<number> {
    if (isRdoDbRecentlyDown()) {
      return getNextFallbackRdoNumber(projectId);
    }

    try {
      const existing = await db
        .select({ rdoNumber: rdos.rdoNumber })
        .from(rdos)
        .where(eq(rdos.projectId, projectId))
        .orderBy(desc(rdos.rdoNumber))
        .limit(1);

      const dbNext = existing.length > 0 ? existing[0].rdoNumber + 1 : 1;
      const fallbackNext = getNextFallbackRdoNumber(projectId);
      return Math.max(dbNext, fallbackNext);
    } catch {
      markRdoDbDown();
      return getNextFallbackRdoNumber(projectId);
    }
  }

  async create(
    data: CreateRdoInput & {
      rdoNumber: number;
      dayOfWeek: string;
      totalHh: string;
      totalHeadcount: number;
      contractorTeamCount: number;
      ownTeamCount: number;
    }
  ): Promise<any> {
    if (isRdoDbRecentlyDown()) {
      return createFallbackRdo(data);
    }

    try {
      const occurrences = Array.isArray(data.occurrences) ? data.occurrences : [];
      const hasOccurrences = occurrences.length > 0 || Boolean(data.hasOccurrences);

      const existingProject = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, data.projectId))
        .limit(1);

      if (existingProject.length === 0) {
        const staticMatch =
          STATIC_PROJECTS.find((p) => p.id === data.projectId) ?? STATIC_PROJECTS[0];
        await db
          .insert(projects)
          .values({
            id: data.projectId,
            name: staticMatch.name,
            code: staticMatch.code,
            companyName: staticMatch.companyName,
            address: staticMatch.address,
            managerName: staticMatch.managerName,
            status: staticMatch.status,
            startDate: staticMatch.startDate,
          })
          .onConflictDoNothing();
      }

      // Insert main RDO
      const [newRdo] = await db
        .insert(rdos)
        .values({
          projectId: data.projectId,
          rdoNumber: data.rdoNumber,
          date: data.date,
          dayOfWeek: data.dayOfWeek,
          dayStatus: data.dayStatus || "trabalhando",
          workCondition: data.workCondition || "praticavel",
          workConditionMorning: data.workConditionMorning || "praticavel",
          workConditionAfternoon: data.workConditionAfternoon || "praticavel",
          weatherMorning: data.weatherMorning || "sol",
          weatherAfternoon: data.weatherAfternoon || "sol",
          ownTeamCount: data.ownTeamCount,
          contractorTeamCount: data.contractorTeamCount,
          totalHeadcount: data.totalHeadcount,
          totalHh: data.totalHh,
          hasOccurrences,
          observations: data.observations || null,
          authorName: data.authorName || "Alberto Martins",
          status: "concluido",
        })
        .returning();

      // Contractors
      if (data.contractors && data.contractors.length > 0) {
        for (const c of data.contractors) {
          if (c.companyName) {
            await db.insert(rdoContractors).values({
              rdoId: newRdo.id,
              companyName: c.companyName,
              trade: c.trade || "Construção Civil",
              workerCount: parseInt(String(c.workerCount ?? 1), 10) || 1,
            });
          }
        }
      }

      // Activities
      if (data.activities && data.activities.length > 0) {
        for (const act of data.activities) {
          if (act.description) {
            await db.insert(rdoActivities).values({
              rdoId: newRdo.id,
              description: act.description,
              location: act.location || "Canteiro Geral",
              status: act.status || "em_andamento",
              hasOvertime: Boolean(act.hasOvertime),
              overtimeHours: act.overtimeHours ? String(act.overtimeHours) : "0",
            });
          }
        }
      }

      // Non-Conformities
      if (data.nonConformities && data.nonConformities.length > 0) {
        for (const nc of data.nonConformities) {
          if (nc.description) {
            await db.insert(rdoNonConformities).values({
              rdoId: newRdo.id,
              description: nc.description,
              nr: nc.nr || null,
              severity: nc.severity || "media",
              correctiveAction: nc.correctiveAction || "",
              status: nc.status || "resolvido",
            });
          }
        }
      }

      // Occurrences
      if (occurrences.length > 0) {
        let occIndex = 1;
        for (const occ of occurrences) {
          if (occ.title || occ.description) {
            await db.insert(rdoOccurrences).values({
              rdoId: newRdo.id,
              orderIndex: occIndex++,
              category: occ.category || "Geral",
              title: occ.title || `Ocorrência #${occIndex - 1}`,
              description: occ.description || "",
              impactedHours: occ.impactedHours ? String(occ.impactedHours) : "0",
            });
          }
        }
      }

      // Photos
      if (data.photos && data.photos.length > 0) {
        for (const photo of data.photos) {
          if (photo.photoUrl) {
            await db.insert(rdoPhotos).values({
              rdoId: newRdo.id,
              activityName: photo.activityName || "Serviço Geral de Canteiro",
              nonConformityText: photo.nonConformityText || null,
              goodPracticeText: photo.goodPracticeText || null,
              caption: photo.caption || "",
              photoUrl: photo.photoUrl,
              timestamp:
                photo.timestamp || `${data.date} ${new Date().toTimeString().slice(0, 8)}`,
              locationText: photo.locationText || "Canteiro de Obras",
              showWatermark: photo.showWatermark !== false,
            });
          }
        }
      }

      return newRdo;
    } catch (e) {
      markRdoDbDown();
      console.warn("DrizzleRdoRepository.create: Database unavailable, persisting RDO in local fallback store.", e);
      return createFallbackRdo(data);
    }
  }

  async update(id: number, body: any): Promise<any | null> {
    if (isRdoDbRecentlyDown()) {
      return updateFallbackRdo(id, body);
    }

    try {
      const [existing] = await db.select().from(rdos).where(eq(rdos.id, id)).limit(1);
      if (!existing) {
        return updateFallbackRdo(id, body);
      }

      const [updated] = await db
        .update(rdos)
        .set({
          dayStatus: body.dayStatus ?? existing.dayStatus,
          workCondition: body.workCondition ?? existing.workCondition,
          workConditionMorning: body.workConditionMorning ?? existing.workConditionMorning,
          workConditionAfternoon: body.workConditionAfternoon ?? existing.workConditionAfternoon,
          weatherMorning: body.weatherMorning ?? existing.weatherMorning,
          weatherAfternoon: body.weatherAfternoon ?? existing.weatherAfternoon,
          ownTeamCount: body.ownTeamCount ?? existing.ownTeamCount,
          contractorTeamCount: body.contractorTeamCount ?? existing.contractorTeamCount,
          totalHeadcount: body.totalHeadcount ?? existing.totalHeadcount,
          totalHh: body.totalHh ? String(body.totalHh) : existing.totalHh,
          hasOccurrences:
            body.hasOccurrences !== undefined
              ? Boolean(body.hasOccurrences)
              : existing.hasOccurrences,
          observations:
            body.observations !== undefined ? body.observations : existing.observations,
          updatedAt: new Date(),
        })
        .where(eq(rdos.id, id))
        .returning();

      if (Array.isArray(body.contractors)) {
        await db.delete(rdoContractors).where(eq(rdoContractors.rdoId, id));
        for (const c of body.contractors) {
          if (c.companyName) {
            await db.insert(rdoContractors).values({
              rdoId: id,
              companyName: c.companyName,
              trade: c.trade || "Construção Civil",
              workerCount: parseInt(String(c.workerCount ?? 1), 10) || 1,
            });
          }
        }
      }

      if (Array.isArray(body.activities)) {
        await db.delete(rdoActivities).where(eq(rdoActivities.rdoId, id));
        for (const act of body.activities) {
          if (act.description) {
            await db.insert(rdoActivities).values({
              rdoId: id,
              description: act.description,
              location: act.location || "Canteiro Geral",
              status: act.status || "em_andamento",
              hasOvertime: Boolean(act.hasOvertime),
              overtimeHours: act.overtimeHours ? String(act.overtimeHours) : "0",
            });
          }
        }
      }

      if (Array.isArray(body.occurrences)) {
        await db.delete(rdoOccurrences).where(eq(rdoOccurrences.rdoId, id));
        let idx = 1;
        for (const occ of body.occurrences) {
          if (occ.title || occ.description) {
            await db.insert(rdoOccurrences).values({
              rdoId: id,
              orderIndex: idx++,
              category: occ.category || "Geral",
              title: occ.title || `Ocorrência #${idx - 1}`,
              description: occ.description || "",
              impactedHours: occ.impactedHours ? String(occ.impactedHours) : "0",
            });
          }
        }
      }

      if (Array.isArray(body.nonConformities)) {
        await db.delete(rdoNonConformities).where(eq(rdoNonConformities.rdoId, id));
        for (const nc of body.nonConformities) {
          if (nc.description) {
            await db.insert(rdoNonConformities).values({
              rdoId: id,
              description: nc.description,
              nr: nc.nr || null,
              severity: nc.severity || "media",
              correctiveAction: nc.correctiveAction || "",
              status: nc.status || "resolvido",
            });
          }
        }
      }

      return updated;
    } catch (e) {
      markRdoDbDown();
      console.warn("DrizzleRdoRepository.update: Database unavailable, updating fallback RDO.", e);
      return updateFallbackRdo(id, body);
    }
  }

  async delete(id: number): Promise<boolean> {
    if (isRdoDbRecentlyDown()) {
      return deleteFallbackRdo(id);
    }

    try {
      await Promise.all([
        db.delete(rdoActivities).where(eq(rdoActivities.rdoId, id)),
        db.delete(rdoContractors).where(eq(rdoContractors.rdoId, id)),
        db.delete(rdoNonConformities).where(eq(rdoNonConformities.rdoId, id)),
        db.delete(rdoOccurrences).where(eq(rdoOccurrences.rdoId, id)),
        db.delete(rdoPhotos).where(eq(rdoPhotos.rdoId, id)),
      ]);
      await db.delete(rdos).where(eq(rdos.id, id));
      deleteFallbackRdo(id);
      return true;
    } catch (e) {
      markRdoDbDown();
      console.warn("DrizzleRdoRepository.delete: Database unavailable, deleting from fallback store.", e);
      return deleteFallbackRdo(id);
    }
  }

  async deletePhoto(id: number): Promise<boolean> {
    if (isRdoDbRecentlyDown()) {
      return deleteFallbackPhoto(id);
    }

    try {
      await db.delete(rdoPhotos).where(eq(rdoPhotos.id, id));
      deleteFallbackPhoto(id);
      return true;
    } catch (e) {
      markRdoDbDown();
      console.warn("DrizzleRdoRepository.deletePhoto: Database unavailable, deleting from fallback store.", e);
      return deleteFallbackPhoto(id);
    }
  }
}

export const defaultRdoRepository = new DrizzleRdoRepository();
