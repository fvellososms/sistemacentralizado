import { NextResponse } from "next/server";
import { criarInspecao, listarInspecoes } from "@/modules/checklists/server";
import { requireSession } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const projectId = Number(new URL(request.url).searchParams.get("projectId"));
    return NextResponse.json({ inspecoes: await listarInspecoes(Number.isSafeInteger(projectId) && projectId > 0 ? projectId : undefined) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar as inspeções.", "GET /api/qualidade/checklists/inspecoes");
  }
}

export async function POST(request: Request) {
  try {
    const inspecao = await criarInspecao(await request.json(), await requireSession());
    return NextResponse.json({ inspecao: { id: inspecao.id } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao salvar a inspeção.", "POST /api/qualidade/checklists/inspecoes");
  }
}
