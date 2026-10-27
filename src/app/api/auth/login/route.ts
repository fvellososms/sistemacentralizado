import { NextResponse } from "next/server";
import { authenticateUser } from "@/modules/users/server";
import { AppError } from "@/shared/errors/AppError";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = await authenticateUser({
      email: body.email ?? "",
      password: body.password ?? "",
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error in POST /api/auth/login:", error);
    return NextResponse.json({ error: "Erro ao autenticar usuário." }, { status: 500 });
  }
}

