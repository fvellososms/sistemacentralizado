import { NextResponse } from "next/server";
import { deleteReminder, updateReminder } from "@/modules/workspace/server";
import { requireSession } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const reminder = await updateReminder((await requireSession()).id, await parseIdParam(params), await request.json());
    return NextResponse.json({ reminder });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar o lembrete.", "PATCH /api/espaco-trabalho/lembretes/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await deleteReminder((await requireSession()).id, await parseIdParam(params));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Falha ao excluir o lembrete.", "DELETE /api/espaco-trabalho/lembretes/[id]");
  }
}
