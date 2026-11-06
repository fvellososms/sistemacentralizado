import { NextResponse } from "next/server";
import { createNaoConformidade, listNaoConformidades } from "@/modules/quality/server";
import { getSessionUser } from "@/modules/users/server";
import { defaultNaoConformidadeRepository } from "@/modules/quality/server";
import { defaultMailer } from "@/shared/email/mailer";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const projectId = parseInt(new URL(request.url).searchParams.get("projectId") ?? "", 10);
  const naoConformidades = await listNaoConformidades({ projectId: isNaN(projectId) ? undefined : projectId });
  return NextResponse.json({ naoConformidades });
}

export async function POST(request: Request) {
  try {
    const { naoConformidade, email } = await createNaoConformidade(
      await request.json(),
      defaultNaoConformidadeRepository,
      defaultMailer,
      await getSessionUser()
    );
    return NextResponse.json({ naoConformidade, email, message: "Não conformidade registrada." }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao registrar a não conformidade.", "Erro ao registrar não conformidade");
  }
}
