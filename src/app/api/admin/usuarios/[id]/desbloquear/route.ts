import { NextResponse } from "next/server";
import { requireAdmin, unlockUser } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json({ user: await unlockUser(await requireAdmin(), await parseIdParam(params)) });
  } catch (error) {
    return errorResponse(error, "Falha ao desbloquear o usuário.", "POST /api/admin/usuarios/[id]/desbloquear");
  }
}
