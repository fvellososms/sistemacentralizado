import { NextResponse } from "next/server";
import { requireAdmin, resetUserPassword } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

/** Generates a new temporary password (shown once to the admin). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await resetUserPassword(await requireAdmin(), await parseIdParam(params)));
  } catch (error) {
    return errorResponse(error, "Falha ao redefinir a senha.", "POST /api/admin/usuarios/[id]/senha");
  }
}
