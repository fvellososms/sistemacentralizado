import { cookies } from "next/headers";
import { COOKIE_OBRA, garantirObra } from "@/db/session";
import { getProjects } from "@/modules/projects/server";

export const dynamic = "force-dynamic";

/**
 * Selects the project (obra) of the APR screens, following the header selector ({ projectId }).
 * { obraId } still selects a row of the APR table directly. The user always comes from the login session.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { obraId?: unknown; projectId?: unknown };
  try {
    let obraId = Number(body.obraId);
    if (body.projectId !== undefined) {
      const projeto = (await getProjects()).find((p) => p.id === Number(body.projectId));
      if (!projeto) return Response.json({ error: "Obra não encontrada." }, { status: 404 });
      obraId = await garantirObra({ codigo: projeto.code, nome: projeto.name, endereco: projeto.address });
    }
    if (!Number.isSafeInteger(obraId) || obraId <= 0) return Response.json({ error: "Obra inválida." }, { status: 400 });

    const store = await cookies();
    const mudou = store.get(COOKIE_OBRA)?.value !== String(obraId);
    store.set(COOKIE_OBRA, String(obraId), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return Response.json({ ok: true, obraId, mudou });
  } catch (error) {
    console.error("POST /api/apr/sessao:", error);
    return Response.json({ error: "Não foi possível selecionar a obra." }, { status: 503 });
  }
}
