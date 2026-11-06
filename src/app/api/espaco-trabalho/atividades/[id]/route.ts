import { NextResponse } from "next/server";
import { deleteActivity, updateActivity } from "@/modules/workspace/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const activity = await updateActivity(await parseIdParam(params), await request.json());
    return NextResponse.json({ activity });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar o registro.", "Erro ao atualizar atividade");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await deleteActivity(await parseIdParam(params));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Falha ao excluir o registro.", "Erro ao excluir atividade");
  }
}
