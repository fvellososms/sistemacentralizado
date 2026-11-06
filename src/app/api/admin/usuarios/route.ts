import { NextResponse } from "next/server";
import { createUser, listUsers, requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ users: await listUsers() });
  } catch (error) {
    return errorResponse(error, "Falha ao listar usuários.", "GET /api/admin/usuarios");
  }
}

/** Returns the temporary password only in this response; it is not stored in plain text. */
export async function POST(request: Request) {
  try {
    const result = await createUser(await requireAdmin(), await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao criar usuário.", "POST /api/admin/usuarios");
  }
}
