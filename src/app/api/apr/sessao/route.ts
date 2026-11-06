import { cookies } from "next/headers";
import { COOKIE_OBRA } from "@/db/session";

export const dynamic = "force-dynamic";

/**
 * Selects the current project (obra) for the APR screens. The user is no longer chosen here:
 * it always comes from the login session (usuarioId is ignored).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { obraId?: unknown };
  const obraId = Number(body.obraId);
  if (!Number.isSafeInteger(obraId) || obraId <= 0) {
    return Response.json({ error: "Obra inválida." }, { status: 400 });
  }
  const store = await cookies();
  store.set(COOKIE_OBRA, String(obraId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}
