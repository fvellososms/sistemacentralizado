import { db } from "@/db";
import { buscaLog } from "@/db/schema";
import { interpretarComIa } from "@/lib/apr/ia";
import { indiceAtividades } from "@/lib/apr/repo";
import { buscarAtividades, decompor, LIMIAR_SATISFATORIA, relevanciaDe, tokens } from "@/lib/apr/search";
import type { BuscaResposta, SugestaoAtividade } from "@/lib/apr/types";
import { getUsuarioAtual } from "@/db/session";

export const dynamic = "force-dynamic";

/**
 * Busca atividades da base de conhecimento a partir de uma descrição livre (RF01–RF03, RN09).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { texto?: string; registrar?: boolean };
  const texto = (body.texto ?? "").trim();
  if (tokens(texto).length === 0) {
    return Response.json({ error: "Descreva a atividade para iniciar a busca." }, { status: 400 });
  }

  try {
    const usuario = await getUsuarioAtual();
    const indice = await indiceAtividades();

    // Decomposição: IA (opcional) ou heurística
    const ia = texto.length > 40 ? await interpretarComIa(texto) : null;
    const trechos = ia ?? decompor(texto);

    // Busca no texto completo + em cada trecho; consolida pelo melhor score
    const consolidado = new Map<number, { score: number; termos: Set<string> }>();
    const consultas = [texto, ...trechos.filter((t) => t !== texto)];
    for (const q of consultas) {
      for (const r of buscarAtividades(q, indice)) {
        const atual = consolidado.get(r.id);
        if (!atual) consolidado.set(r.id, { score: r.score, termos: new Set(r.termosCorrespondentes) });
        else {
          atual.score = Math.max(atual.score, r.score);
          r.termosCorrespondentes.forEach((t) => atual.termos.add(t));
        }
      }
    }

    const porId = new Map(indice.map((a) => [a.id, a]));
    const sugestoes: SugestaoAtividade[] = [...consolidado.entries()]
      .map(([id, v]) => {
        const a = porId.get(id)!;
        return {
          id,
          nome: a.nome,
          categoria: a.categoria,
          descricao: a.descricao,
          score: Number(v.score.toFixed(3)),
          relevancia: relevanciaDe(v.score),
          termosCorrespondentes: [...v.termos].slice(0, 3),
          qtdRiscos: a.qtdRiscos,
        };
      })
      .sort((x, y) => y.score - x.score)
      .slice(0, 8);

    const melhorScore = sugestoes[0]?.score ?? 0;
    const satisfatoria = melhorScore >= LIMIAR_SATISFATORIA;

    if (body.registrar !== false) {
      await db.insert(buscaLog).values({
        textoBusca: texto.slice(0, 2000),
        melhorScore,
        satisfatoria,
        usuarioId: usuario.id,
      });
    }

    const resposta: BuscaResposta = { sugestoes, melhorScore, satisfatoria, trechos, interpretadoPorIa: Boolean(ia) };
    return Response.json(resposta);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Não foi possível consultar a base de conhecimento." }, { status: 500 });
  }
}
