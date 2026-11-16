import { NextResponse } from "next/server";
import { createReminder, listReminders } from "@/modules/workspace/server";
import { requireSession } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

/** Reminders of the logged user only. */
export async function GET() {
  try {
    return NextResponse.json({ reminders: await listReminders((await requireSession()).id) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar os lembretes.", "GET /api/espaco-trabalho/lembretes");
  }
}

export async function POST(request: Request) {
  try {
    const reminder = await createReminder((await requireSession()).id, await request.json());
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao criar o lembrete.", "POST /api/espaco-trabalho/lembretes");
  }
}
