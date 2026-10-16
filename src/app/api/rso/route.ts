import { NextResponse } from "next/server";
import { getWeeklyRso } from "@/modules/rso/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId") || "1";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const projectId = parseInt(projectIdParam, 10) || 1;
    const report = await getWeeklyRso({ projectId, startDate, endDate });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error in GET /api/rso:", error);
    return NextResponse.json({ error: "Erro ao gerar Relatório Semanal" }, { status: 500 });
  }
}
