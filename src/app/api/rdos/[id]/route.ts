import { NextResponse } from "next/server";
import { db } from "@/db";
import { rdos, rdoContractors, rdoActivities, rdoNonConformities, rdoOccurrences, rdoPhotos, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteRdo } from "@/modules/rdo/server";
import { AppError } from "@/shared/errors/AppError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rdoId = parseInt(id, 10);
    if (isNaN(rdoId)) {
      return NextResponse.json({ error: "Invalid RDO ID" }, { status: 400 });
    }

    const rdoResult = await db.select().from(rdos).where(eq(rdos.id, rdoId)).limit(1);
    if (!rdoResult.length) {
      return NextResponse.json({ error: "RDO não encontrado" }, { status: 404 });
    }

    const rdo = rdoResult[0];

    // Fetch project
    const projectResult = await db.select().from(projects).where(eq(projects.id, rdo.projectId)).limit(1);
    const project = projectResult[0] || null;

    // Fetch related items
    const [contractors, activities, nonConformities, occurrences, photos] = await Promise.all([
      db.select().from(rdoContractors).where(eq(rdoContractors.rdoId, rdoId)),
      db.select().from(rdoActivities).where(eq(rdoActivities.rdoId, rdoId)),
      db.select().from(rdoNonConformities).where(eq(rdoNonConformities.rdoId, rdoId)),
      db.select().from(rdoOccurrences).where(eq(rdoOccurrences.rdoId, rdoId)).orderBy(rdoOccurrences.orderIndex),
      db.select().from(rdoPhotos).where(eq(rdoPhotos.rdoId, rdoId)),
    ]);

    return NextResponse.json({
      rdo: {
        ...rdo,
        project,
        contractors,
        activities,
        nonConformities,
        occurrences,
        photos,
      },
    });
  } catch (error) {
    console.error("Error fetching single RDO:", error);
    return NextResponse.json({ error: "Erro ao buscar RDO" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rdoId = parseInt(id, 10);
    if (isNaN(rdoId)) {
      return NextResponse.json({ error: "Invalid RDO ID" }, { status: 400 });
    }

    const body = await request.json();

    const [existing] = await db.select().from(rdos).where(eq(rdos.id, rdoId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "RDO não encontrado" }, { status: 404 });
    }

    const ownCount = body.ownTeamCount !== undefined ? parseInt(String(body.ownTeamCount), 10) : existing.ownTeamCount;
    const contractors = Array.isArray(body.contractors) ? body.contractors : null;
    let contractorCount = existing.contractorTeamCount;

    if (contractors) {
      contractorCount = contractors.reduce(
        (sum: number, c: { workerCount?: number | string }) => sum + (parseInt(String(c.workerCount ?? 0), 10) || 0),
        0
      );
    }

    const totalHeadcount = ownCount + contractorCount;

    // Update main RDO
    const [updated] = await db
      .update(rdos)
      .set({
        dayStatus: body.dayStatus ?? existing.dayStatus,
        workCondition: body.workCondition ?? existing.workCondition,
        weatherMorning: body.weatherMorning ?? existing.weatherMorning,
        weatherAfternoon: body.weatherAfternoon ?? existing.weatherAfternoon,
        ownTeamCount: ownCount,
        contractorTeamCount: contractorCount,
        totalHeadcount,
        totalHh: body.totalHh ? String(body.totalHh) : existing.totalHh,
        hasOccurrences: body.hasOccurrences !== undefined ? Boolean(body.hasOccurrences) : existing.hasOccurrences,
        observations: body.observations !== undefined ? body.observations : existing.observations,
        updatedAt: new Date(),
      })
      .where(eq(rdos.id, rdoId))
      .returning();

    // If contractors provided, replace them
    if (contractors) {
      await db.delete(rdoContractors).where(eq(rdoContractors.rdoId, rdoId));
      for (const c of contractors) {
        if (c.companyName) {
          await db.insert(rdoContractors).values({
            rdoId,
            companyName: c.companyName,
            trade: c.trade || "Construção Civil",
            workerCount: parseInt(String(c.workerCount ?? 1), 10) || 1,
          });
        }
      }
    }

    // If activities provided, replace them
    if (Array.isArray(body.activities)) {
      await db.delete(rdoActivities).where(eq(rdoActivities.rdoId, rdoId));
      for (const act of body.activities) {
        if (act.description) {
          await db.insert(rdoActivities).values({
            rdoId,
            description: act.description,
            location: act.location || "Canteiro Geral",
            status: act.status || "em_andamento",
            hasOvertime: Boolean(act.hasOvertime),
            overtimeHours: act.overtimeHours ? String(act.overtimeHours) : "0",
          });
        }
      }
    }

    // If occurrences provided, replace them
    if (Array.isArray(body.occurrences)) {
      await db.delete(rdoOccurrences).where(eq(rdoOccurrences.rdoId, rdoId));
      let idx = 1;
      for (const occ of body.occurrences) {
        if (occ.title || occ.description) {
          await db.insert(rdoOccurrences).values({
            rdoId,
            orderIndex: idx++,
            category: occ.category || "Geral",
            title: occ.title || `Ocorrência #${idx - 1}`,
            description: occ.description || "",
            impactedHours: occ.impactedHours ? String(occ.impactedHours) : "0",
          });
        }
      }
    }

    // If nonConformities provided, replace them
    if (Array.isArray(body.nonConformities)) {
      await db.delete(rdoNonConformities).where(eq(rdoNonConformities.rdoId, rdoId));
      for (const nc of body.nonConformities) {
        if (nc.description) {
          await db.insert(rdoNonConformities).values({
            rdoId,
            description: nc.description,
            nr: nc.nr || null,
            severity: nc.severity || "media",
            correctiveAction: nc.correctiveAction || "",
            status: nc.status || "resolvido",
          });
        }
      }
    }

    return NextResponse.json({ rdo: updated, message: "RDO atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating RDO:", error);
    return NextResponse.json({ error: "Erro ao atualizar RDO" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rdoId = parseInt(id, 10);
    if (isNaN(rdoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await deleteRdo(rdoId);
    return NextResponse.json({ success: true, message: "RDO excluído com sucesso!" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error deleting RDO:", error);
    return NextResponse.json({ error: "Erro ao excluir RDO" }, { status: 500 });
  }
}
