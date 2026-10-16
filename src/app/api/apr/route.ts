import { listarAprs, salvarApr } from "@/lib/apr/repo";
import type { AprDraft, AprStatus } from "@/lib/apr/types";
import { getUsuarioAtual } from "@/db/session";
import { validarDraft } from "@/lib/apr/validacao";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;
  try {
    const rows = await listarAprs({
      obraId: p.get("obraId") ? Number(p.get("obraId")) : undefined,
      status: (p.get("status") as AprStatus | null) ?? undefined,
      atividade: p.get("atividade") ?? undefined,
      de: p.get("de") ?? undefined,
      ate: p.get("ate") ?? undefined,
      q: p.get("q") ?? undefined,
    });
    return Response.json({ itens: rows });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Falha ao listar APRs." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const draft = (await req.json().catch(() => null)) as AprDraft | null;
  if (!draft) return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const erros = validarDraft(draft, 1);
  if (Object.keys(erros).length) return Response.json({ error: "Verifique os campos obrigatórios.", erros }, { status: 422 });
  try {
    const usuario = await getUsuarioAtual();
    const id = await salvarApr({ ...draft, id: null }, usuario.id);
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Falha ao salvar APR." }, { status: 500 });
  }
}
