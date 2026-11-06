import { NextResponse } from "next/server";
import { requireAdmin, updateUser } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await updateUser(await requireAdmin(), await parseIdParam(params), await request.json());
    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar usuário.", "PATCH /api/admin/usuarios/[id]");
  }
}
