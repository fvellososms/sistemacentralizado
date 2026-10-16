import { aprovarApr, carregarApr, reprovarApr, submeterApr } from "@/lib/apr/repo";
import { getUsuarioAtual } from "@/db/session";

export const dynamic = "force-dynamic";

/** Transições de estado: submeter (autor), aprovar / reprovar (aprovador). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const aprId = Number(id);
  const body = (await req.json().catch(() => ({}))) as { acao?: string; motivo?: string };
  try {
    const usuario = await getUsuarioAtual();
    const a = await carregarApr(aprId);
    if (!a) return Response.json({ error: "APR não encontrada." }, { status: 404 });

    switch (body.acao) {
      case "submeter":
        if (a.autorId && a.autorId !== usuario.id && usuario.perfil !== "admin_sst") {
          return Response.json({ error: "Somente o autor pode enviar esta APR para aprovação." }, { status: 403 });
        }
        await submeterApr(aprId);
        break;
      case "aprovar":
        if (usuario.perfil !== "aprovador") return Response.json({ error: "Somente o perfil Aprovador pode aprovar uma APR." }, { status: 403 });
        await aprovarApr(aprId, usuario.id);
        break;
      case "reprovar":
        if (usuario.perfil !== "aprovador") return Response.json({ error: "Somente o perfil Aprovador pode reprovar uma APR." }, { status: 403 });
        await reprovarApr(aprId, usuario.id, body.motivo ?? "");
        break;
      default:
        return Response.json({ error: "Ação inválida." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Falha ao executar ação." }, { status: 400 });
  }
}
