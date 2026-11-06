import { NextResponse } from "next/server";
import { updateClientCompany } from "@/modules/clients/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await updateClientCompany(await requireAdmin(), await parseIdParam(params), await request.json());
    return NextResponse.json({ company });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar empresa.", "PATCH /api/admin/empresas/[id]");
  }
}
