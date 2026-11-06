import { NextResponse } from "next/server";
import { sendNcReminders } from "@/modules/quality/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

/**
 * Daily NC deadline reminders. Called by the Vercel Cron (vercel.json), which sends
 * "Authorization: Bearer <CRON_SECRET>". Without CRON_SECRET configured the route stays disabled.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    return NextResponse.json(await sendNcReminders());
  } catch (error) {
    return errorResponse(error, "Falha ao enviar lembretes.", "GET /api/cron/nc-lembretes");
  }
}
