import { NextResponse } from "next/server";
import { changeOwnPassword, issueSession, requireSession } from "@/modules/users/server";
import { toSessionUser } from "@/modules/users/application/user-mapper";
import { errorResponse } from "@/shared/http/route-error";

/** POST { currentPassword, newPassword }: changes the password and renews the session without the "must change" flag. */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const profile = await changeOwnPassword(session, body.currentPassword ?? "", body.newPassword ?? "");
    await issueSession(toSessionUser(profile));
    return NextResponse.json({ profile, message: "Senha alterada com sucesso." });
  } catch (error) {
    return errorResponse(error, "Falha ao alterar a senha.", "Error in POST /api/auth/alterar-senha");
  }
}
