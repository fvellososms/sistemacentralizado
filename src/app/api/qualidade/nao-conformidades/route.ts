import { NextResponse } from "next/server";
import { createNaoConformidade, listNaoConformidades } from "@/modules/quality/server";
import { AppError } from "@/shared/errors/AppError";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const projectId = parseInt(new URL(request.url).searchParams.get("projectId") ?? "", 10);
  const naoConformidades = await listNaoConformidades({ projectId: isNaN(projectId) ? undefined : projectId });
  return NextResponse.json({ naoConformidades });
}

export async function POST(request: Request) {
  try {
    const naoConformidade = await createNaoConformidade(await request.json());
    return NextResponse.json({ naoConformidade, message: "Não conformidade registrada." }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("Erro ao registrar não conformidade:", error);
    return NextResponse.json({ error: "Falha ao registrar a não conformidade." }, { status: 500 });
  }
}
