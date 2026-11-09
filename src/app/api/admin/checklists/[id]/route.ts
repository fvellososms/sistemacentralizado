import { NextResponse } from "next/server";
import { definirModeloAtivo } from "@/modules/checklists/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await definirModeloAtivo(await parseIdParam(params), (await request.json()).ativo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar o checklist.", "PATCH /api/admin/checklists/[id]");
  }
}
