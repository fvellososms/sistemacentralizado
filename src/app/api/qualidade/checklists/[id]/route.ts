import { NextResponse } from "next/server";
import { obterModelo } from "@/modules/checklists/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json({ modelo: await obterModelo(await parseIdParam(params)) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar o checklist.", "GET /api/qualidade/checklists/[id]");
  }
}
