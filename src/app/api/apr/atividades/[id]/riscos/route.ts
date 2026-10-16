import { riscosDaAtividade } from "@/lib/apr/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const atividadeId = Number(id);
  if (!Number.isFinite(atividadeId)) return Response.json({ error: "Atividade inválida" }, { status: 400 });
  try {
    const riscos = await riscosDaAtividade(atividadeId);
    return Response.json({ riscos });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Falha ao carregar riscos da atividade." }, { status: 500 });
  }
}
