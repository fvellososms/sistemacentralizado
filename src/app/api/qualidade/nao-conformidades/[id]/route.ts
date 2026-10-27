import { NextResponse } from "next/server";
import { resolveNaoConformidade } from "@/modules/quality/server";
import { AppError } from "@/shared/errors/AppError";

/** PATCH { status: "resolvida" } marks the NC as resolved. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    if (isNaN(id) || body.status !== "resolvida") throw AppError.badRequest("Requisição inválida.");
    const naoConformidade = await resolveNaoConformidade(id);
    return NextResponse.json({ naoConformidade });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("Erro ao atualizar não conformidade:", error);
    return NextResponse.json({ error: "Falha ao atualizar a não conformidade." }, { status: 500 });
  }
}
