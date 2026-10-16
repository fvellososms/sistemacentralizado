import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atividadeRisco, atividadeTermos, atividades, buscaLog, medidasControle, riscoControle, riscoNr, riscos } from "@/db/schema";
import { carregarBase } from "@/lib/apr/base";
import type { TipoControle } from "@/lib/apr/types";
import { getUsuarioAtual } from "@/db/session";

export const dynamic = "force-dynamic";

async function exigirAdmin() {
  const u = await getUsuarioAtual();
  if (u.perfil !== "admin_sst") throw new Response(JSON.stringify({ error: "Somente o Administrador SST pode alterar a base de conhecimento." }), { status: 403 });
  return u;
}


export async function GET() {
  try {
    await exigirAdmin();
    return Response.json(await carregarBase());
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Falha ao carregar base." }, { status: 500 });
  }
}

interface AtividadeIn {
  id?: number;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  ativo?: boolean;
  termos: string[];
  riscos: { riscoId: number; probabilidade: string; severidade: string }[];
}
interface RiscoIn {
  id?: number;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  nrIds: number[];
  controles: { controleId: number; obrigatorio: boolean }[];
}
interface ControleIn {
  id?: number;
  nome: string;
  descricao?: string | null;
  tipoControle: TipoControle;
  ativo?: boolean;
}

export async function POST(req: Request) {
  try {
    await exigirAdmin();
    const body = (await req.json()) as { tipo: string; item: unknown };
    if (body.tipo === "atividade") {
      const it = body.item as AtividadeIn;
      if (!it.nome?.trim()) return Response.json({ error: "Informe o nome da atividade." }, { status: 422 });
      const id = await db.transaction(async (tx) => {
        const vals = { nome: it.nome.trim(), descricao: it.descricao?.trim() || null, categoria: it.categoria?.trim() || null, ativo: it.ativo ?? true };
        let id = it.id;
        if (id) await tx.update(atividades).set(vals).where(eq(atividades.id, id));
        else id = (await tx.insert(atividades).values(vals).returning({ id: atividades.id }))[0].id;
        await tx.delete(atividadeTermos).where(eq(atividadeTermos.atividadeId, id));
        await tx.delete(atividadeRisco).where(eq(atividadeRisco.atividadeId, id));
        const termos = [...new Set(it.termos.map((t) => t.trim()).filter(Boolean))];
        if (termos.length) await tx.insert(atividadeTermos).values(termos.map((termo) => ({ atividadeId: id!, termo })));
        if (it.riscos.length) await tx.insert(atividadeRisco).values(it.riscos.map((r) => ({ atividadeId: id!, riscoId: r.riscoId, probabilidade: r.probabilidade, severidade: r.severidade })));
        return id;
      });
      return Response.json({ id });
    }
    if (body.tipo === "risco") {
      const it = body.item as RiscoIn;
      if (!it.nome?.trim()) return Response.json({ error: "Informe o nome do risco." }, { status: 422 });
      const id = await db.transaction(async (tx) => {
        const vals = { nome: it.nome.trim(), descricao: it.descricao?.trim() || null, ativo: it.ativo ?? true };
        let id = it.id;
        if (id) await tx.update(riscos).set(vals).where(eq(riscos.id, id));
        else id = (await tx.insert(riscos).values(vals).returning({ id: riscos.id }))[0].id;
        await tx.delete(riscoNr).where(eq(riscoNr.riscoId, id));
        await tx.delete(riscoControle).where(eq(riscoControle.riscoId, id));
        if (it.nrIds.length) await tx.insert(riscoNr).values(it.nrIds.map((nrId) => ({ riscoId: id!, nrId })));
        if (it.controles.length) await tx.insert(riscoControle).values(it.controles.map((c) => ({ riscoId: id!, controleId: c.controleId, obrigatorio: c.obrigatorio })));
        return id;
      });
      return Response.json({ id });
    }
    if (body.tipo === "controle") {
      const it = body.item as ControleIn;
      if (!it.nome?.trim()) return Response.json({ error: "Informe o nome da medida." }, { status: 422 });
      const vals = { nome: it.nome.trim(), descricao: it.descricao?.trim() || null, tipoControle: it.tipoControle, ativo: it.ativo ?? true };
      if (it.id) {
        await db.update(medidasControle).set(vals).where(eq(medidasControle.id, it.id));
        return Response.json({ id: it.id });
      }
      const [n] = await db.insert(medidasControle).values(vals).returning({ id: medidasControle.id });
      return Response.json({ id: n.id });
    }
    if (body.tipo === "termo") {
      const it = body.item as { atividadeId: number; termo: string; buscaId?: number };
      if (!it.termo?.trim()) return Response.json({ error: "Informe o termo." }, { status: 422 });
      await db.insert(atividadeTermos).values({ atividadeId: it.atividadeId, termo: it.termo.trim() });
      if (it.buscaId) await db.update(buscaLog).set({ revisada: true }).where(eq(buscaLog.id, it.buscaId));
      return Response.json({ ok: true });
    }
    if (body.tipo === "busca_revisada") {
      const it = body.item as { id: number };
      await db.update(buscaLog).set({ revisada: true }).where(eq(buscaLog.id, it.id));
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Tipo inválido." }, { status: 400 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return Response.json({ error: "Falha ao salvar." }, { status: 500 });
  }
}
