import { NextResponse } from "next/server";
import { obterInspecao } from "@/modules/checklists/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json({ inspecao: await obterInspecao(await parseIdParam(params)) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar a inspeção.", "GET /api/qualidade/checklists/inspecoes/[id]");
  }
}
