import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  atividadeRisco,
  atividadeTermos,
  atividades,
  buscaLog,
  medidasControle,
  nrs,
  riscoControle,
  riscoNr,
  riscos,
  usuarios,
} from "@/db/schema";

export async function carregarBase() {
  const [atvs, termos, ar, rs, rn, rc, cs, ns, buscas] = await Promise.all([
    db.select().from(atividades).orderBy(asc(atividades.nome)),
    db.select().from(atividadeTermos),
    db.select().from(atividadeRisco),
    db.select().from(riscos).orderBy(asc(riscos.nome)),
    db.select().from(riscoNr),
    db.select().from(riscoControle),
    db.select().from(medidasControle).orderBy(asc(medidasControle.nome)),
    db.select().from(nrs).orderBy(asc(nrs.codigo)),
    db
      .select({
        id: buscaLog.id,
        textoBusca: buscaLog.textoBusca,
        melhorScore: buscaLog.melhorScore,
        satisfatoria: buscaLog.satisfatoria,
        revisada: buscaLog.revisada,
        criadoEm: buscaLog.criadoEm,
        usuario: usuarios.nome,
      })
      .from(buscaLog)
      .leftJoin(usuarios, eq(usuarios.id, buscaLog.usuarioId))
      .where(and(eq(buscaLog.satisfatoria, false), eq(buscaLog.revisada, false)))
      .orderBy(desc(buscaLog.criadoEm))
      .limit(100),
  ]);
  return {
    atividades: atvs.map((a) => ({
      ...a,
      termos: termos.filter((t) => t.atividadeId === a.id).map((t) => t.termo),
      riscos: ar.filter((x) => x.atividadeId === a.id).map((x) => ({ riscoId: x.riscoId, probabilidade: x.probabilidade, severidade: x.severidade })),
    })),
    riscos: rs.map((r) => ({
      ...r,
      nrIds: rn.filter((x) => x.riscoId === r.id).map((x) => x.nrId),
      controles: rc.filter((x) => x.riscoId === r.id).map((x) => ({ controleId: x.controleId, obrigatorio: x.obrigatorio })),
    })),
    controles: cs,
    nrs: ns,
    buscas: buscas.map((b) => ({ ...b, criadoEm: b.criadoEm.toISOString() })),
  };
}

export type BaseDados = Awaited<ReturnType<typeof carregarBase>>;
