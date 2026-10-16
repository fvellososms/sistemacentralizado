import { carregarApr, salvarApr } from "@/lib/apr/repo";
import type { AprDraft } from "@/lib/apr/types";
import { validarDraft } from "@/lib/apr/validacao";
import { getUsuarioAtual } from "@/db/session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const a = await carregarApr(Number(id));
    if (!a) return Response.json({ error: "APR não encontrada." }, { status: 404 });
    return Response.json(a);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Falha ao carregar APR." }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const draft = (await req.json().catch(() => null)) as AprDraft | null;
  if (!draft) return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const erros = validarDraft(draft, 1);
  if (Object.keys(erros).length) return Response.json({ error: "Verifique os campos obrigatórios.", erros }, { status: 422 });
  try {
    const usuario = await getUsuarioAtual();
    const existente = await carregarApr(Number(id));
    if (!existente) return Response.json({ error: "APR não encontrada." }, { status: 404 });
    if (existente.autorId && existente.autorId !== usuario.id && usuario.perfil !== "admin_sst") {
      return Response.json({ error: "Somente o autor pode editar esta APR." }, { status: 403 });
    }
    if (existente.status === "aprovada" || existente.status === "aguardando_aprovacao") {
      return Response.json({ error: "Esta APR não pode mais ser editada." }, { status: 409 });
    }
    await salvarApr({ ...draft, id: Number(id) }, usuario.id);
    return Response.json({ id: Number(id) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Falha ao salvar APR." }, { status: 500 });
  }
}
