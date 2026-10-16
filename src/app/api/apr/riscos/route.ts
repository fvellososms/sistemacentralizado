import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { riscos } from "@/db/schema";
import { riscoBasePorId } from "@/lib/apr/repo";

export const dynamic = "force-dynamic";

/** Busca de riscos cadastrados para inclusão manual (autocomplete). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const id = url.searchParams.get("id");
  try {
    if (id) {
      const r = await riscoBasePorId(Number(id));
      return Response.json({ risco: r });
    }
    const rows = await db
      .select({ id: riscos.id, nome: riscos.nome, descricao: riscos.descricao })
      .from(riscos)
      .where(q ? and(eq(riscos.ativo, true), ilike(riscos.nome, `%${q}%`)) : eq(riscos.ativo, true))
      .orderBy(asc(riscos.nome))
      .limit(8);
    return Response.json({ itens: rows });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Falha ao buscar riscos." }, { status: 500 });
  }
}
