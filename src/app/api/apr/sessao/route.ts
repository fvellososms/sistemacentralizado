import { cookies } from "next/headers";
import { COOKIE_OBRA, COOKIE_USUARIO } from "@/db/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { obraId?: number; usuarioId?: number };
  const store = await cookies();
  const opts = { path: "/", httpOnly: true, sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30 };
  if (body.obraId) store.set(COOKIE_OBRA, String(body.obraId), opts);
  if (body.usuarioId) store.set(COOKIE_USUARIO, String(body.usuarioId), opts);
  return Response.json({ ok: true });
}
