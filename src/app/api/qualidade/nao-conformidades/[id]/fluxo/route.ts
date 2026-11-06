import { NextResponse } from "next/server";
import { executeNcAction } from "@/modules/quality/server";
import { requireSession } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

/**
 * POST { acao, ... } runs one step of the NC cycle:
 * definir_plano, concluir_acao, enviar_verificacao, verificar (admin), prorrogar (admin), cancelar (admin).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await executeNcAction(await parseIdParam(params), await request.json(), await requireSession());
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar a não conformidade.", "POST /api/qualidade/nao-conformidades/[id]/fluxo");
  }
}
