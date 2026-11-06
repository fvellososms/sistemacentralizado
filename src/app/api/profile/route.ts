import { NextResponse } from "next/server";
import { getProfile, issueSession, requireSession, updateProfile } from "@/modules/users/server";
import { toSessionUser } from "@/modules/users/application/user-mapper";
import { errorResponse } from "@/shared/http/route-error";

export async function GET() {
  try {
    const profile = await getProfile(await requireSession());
    return NextResponse.json({ profile });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar o perfil.", "Error in GET /api/profile");
  }
}

export async function PUT(request: Request) {
  try {
    const updated = await updateProfile(await requireSession(), await request.json());
    await issueSession(toSessionUser(updated)); // keeps name/e-mail in the session up to date
    return NextResponse.json({ profile: updated, message: "Perfil atualizado com sucesso!" });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar o perfil.", "Error in PUT /api/profile");
  }
}
