import { NextResponse } from "next/server";
import { createActivity, listActivities } from "@/modules/workspace/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET() {
  const activities = await listActivities();
  return NextResponse.json({ activities });
}

/** POST { source: "visita" | "manual", ...dados, photos? } */
export async function POST(request: Request) {
  try {
    const activity = await createActivity(await request.json());
    return NextResponse.json({ activity, message: "Registro salvo." }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao salvar o registro.", "Erro ao registrar atividade");
  }
}
