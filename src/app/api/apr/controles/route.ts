import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { medidasControle } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Busca de medidas de controle cadastradas para inclusão manual (autocomplete). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  try {
    const rows = await db
      .select({
        id: medidasControle.id,
        nome: medidasControle.nome,
        descricao: medidasControle.descricao,
        tipoControle: medidasControle.tipoControle,
      })
      .from(medidasControle)
      .where(q ? and(eq(medidasControle.ativo, true), ilike(medidasControle.nome, `%${q}%`)) : eq(medidasControle.ativo, true))
      .orderBy(asc(medidasControle.nome))
      .limit(8);
    return Response.json({ itens: rows });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Falha ao buscar medidas de controle." }, { status: 500 });
  }
}
