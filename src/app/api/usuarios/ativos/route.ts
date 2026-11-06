import { NextResponse } from "next/server";
import { listTeamMembers, requireSession } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

/** Active users (id, name, role) for the "colaborador" selectors. Any logged user. */
export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ users: await listTeamMembers() });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar a equipe.", "GET /api/usuarios/ativos");
  }
}
