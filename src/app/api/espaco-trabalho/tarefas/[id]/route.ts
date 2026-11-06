import { NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/modules/workspace/server";
import { AppError } from "@/shared/errors/AppError";
import { parseIdParam } from "@/shared/http/route-params";

type Params = { params: Promise<{ id: string }> };

const parseId = ({ params }: Params) => parseIdParam(params);

export async function PATCH(request: Request, context: Params) {
  try {
    const task = await updateTask(await parseId(context), await request.json());
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json({ error: "Falha ao atualizar a tarefa." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    await deleteTask(await parseId(context));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("Erro ao excluir tarefa:", error);
    return NextResponse.json({ error: "Falha ao excluir a tarefa." }, { status: 500 });
  }
}
