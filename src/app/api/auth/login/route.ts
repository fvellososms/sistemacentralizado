import { NextResponse } from "next/server";
import { authenticateUser, issueSession } from "@/modules/users/server";
import { toSessionUser } from "@/modules/users/application/user-mapper";
import { errorResponse } from "@/shared/http/route-error";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const profile = await authenticateUser({ email: body.email ?? "", password: body.password ?? "" });
    await issueSession(toSessionUser(profile));
    return NextResponse.json({ profile });
  } catch (error) {
    return errorResponse(error, "Erro ao autenticar usuário.", "Error in POST /api/auth/login");
  }
}
