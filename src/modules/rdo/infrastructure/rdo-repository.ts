import { db } from "@/db";
import {
  rdos,
  rdoContractors,
  rdoActivities,
  rdoNonConformities,
  rdoOccurrences,
  rdoPhotos,
} from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import type { CreateRdoInput } from "../domain/types";

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
  delete(id: number): Promise<boolean>;
  deletePhoto(id: number): Promise<boolean>;
}

export class DrizzleRdoRepository implements RdoRepository {
  async findMany(filter?: { projectId?: number; month?: string }): Promise<any[]> {
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

      const fullItems = await Promise.all(
        rdoList.map(async (rdo) => {
          const [acts, occs, contractors, photosList] = await Promise.all([
            db.select().from(rdoActivities).where(eq(rdoActivities.rdoId, rdo.id)),
            db.select().from(rdoOccurrences).where(eq(rdoOccurrences.rdoId, rdo.id)),
            db.select().from(rdoContractors).where(eq(rdoContractors.rdoId, rdo.id)),
            db.select().from(rdoPhotos).where(eq(rdoPhotos.rdoId, rdo.id)),
          ]);

          return {
            ...rdo,
            activitiesCount: acts.length,
            activitiesSummary: acts.map((a) => a.description).join("; "),
            contractorsList: contractors,
            occurrencesCount: occs.length,
            photosCount: photosList.length,
            photosPreview: photosList.slice(0, 3).map((p) => p.photoUrl),
          };
        })
      );

      return fullItems;
    } catch (e) {
      console.warn("DrizzleRdoRepository: Database unavailable, returning empty list.");
      return [];
    }
  }

  async findById(id: number): Promise<any | null> {
    try {
      const results = await db.select().from(rdos).where(eq(rdos.id, id)).limit(1);
      if (!results.length) return null;
      const rdo = results[0];

      const [acts, occs, nonConfs, contractors, photosList] = await Promise.all([
        db.select().from(rdoActivities).where(eq(rdoActivities.rdoId, id)),
        db.select().from(rdoOccurrences).where(eq(rdoOccurrences.rdoId, id)),
        db.select().from(rdoNonConformities).where(eq(rdoNonConformities.rdoId, id)),
        db.select().from(rdoContractors).where(eq(rdoContractors.rdoId, id)),
        db.select().from(rdoPhotos).where(eq(rdoPhotos.rdoId, id)),
      ]);

      return {
        ...rdo,
        activities: acts,
        occurrences: occs,
        nonConformities: nonConfs,
        contractors,
        photos: photosList,
      };
    } catch (e) {
      console.warn("DrizzleRdoRepository.findById failed:", e);
      return null;
    }
  }

  async getNextRdoNumber(projectId: number): Promise<number> {
    try {
      const existing = await db
        .select({ rdoNumber: rdos.rdoNumber })
        .from(rdos)
        .where(eq(rdos.projectId, projectId))
        .orderBy(desc(rdos.rdoNumber))
        .limit(1);

      return existing.length > 0 ? existing[0].rdoNumber + 1 : 1;
    } catch {
      return 1;
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
    const occurrences = Array.isArray(data.occurrences) ? data.occurrences : [];
    const hasOccurrences = occurrences.length > 0 || Boolean(data.hasOccurrences);

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
            timestamp: photo.timestamp || `${data.date} ${new Date().toTimeString().slice(0, 8)}`,
            locationText: photo.locationText || "Canteiro de Obras",
            showWatermark: photo.showWatermark !== false,
          });
        }
      }
    }

    return newRdo;
  }

  async delete(id: number): Promise<boolean> {
    try {
      await Promise.all([
        db.delete(rdoActivities).where(eq(rdoActivities.rdoId, id)),
        db.delete(rdoContractors).where(eq(rdoContractors.rdoId, id)),
        db.delete(rdoNonConformities).where(eq(rdoNonConformities.rdoId, id)),
        db.delete(rdoOccurrences).where(eq(rdoOccurrences.rdoId, id)),
        db.delete(rdoPhotos).where(eq(rdoPhotos.rdoId, id)),
      ]);
      await db.delete(rdos).where(eq(rdos.id, id));
      return true;
    } catch (e) {
      console.error("DrizzleRdoRepository.delete failed:", e);
      return false;
    }
  }

  async deletePhoto(id: number): Promise<boolean> {
    try {
      await db.delete(rdoPhotos).where(eq(rdoPhotos.id, id));
      return true;
    } catch (e) {
      console.error("DrizzleRdoRepository.deletePhoto failed:", e);
      return false;
    }
  }
}

export const defaultRdoRepository = new DrizzleRdoRepository();

