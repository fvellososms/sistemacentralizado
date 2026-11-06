import { NextResponse } from "next/server";
import { defaultNaoConformidadeRepository, getNaoConformidadeDetail, resolveNaoConformidade } from "@/modules/quality/server";
import { requireAdmin } from "@/modules/users/server";
import { AppError } from "@/shared/errors/AppError";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export const dynamic = "force-dynamic";

/** NC with its action plan and history. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json({ naoConformidade: await getNaoConformidadeDetail(await parseIdParam(params)) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar a não conformidade.", "GET /api/qualidade/nao-conformidades/[id]");
  }
}

/** Legacy: PATCH { status: "resolvida" } closes the NC directly (admin only). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = await parseIdParam(params);
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    if (body.status !== "resolvida") throw AppError.badRequest("Requisição inválida.");
    const naoConformidade = await resolveNaoConformidade(id, defaultNaoConformidadeRepository, await requireAdmin());
    return NextResponse.json({ naoConformidade });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar a não conformidade.", "PATCH /api/qualidade/nao-conformidades/[id]");
  }
}
