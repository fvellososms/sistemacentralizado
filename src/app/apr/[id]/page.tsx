import Link from "next/link";
import { notFound } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Alert } from "@/components/ui";
import { AprAcoes } from "@/components/apr/AprAcoes";
import { AprPdfButton } from "@/components/apr/AprPdfButton";
import { AprResumo } from "@/components/apr/AprResumo";
import { AprStatusBadge } from "@/components/apr/shared";
import { formatarData } from "@/lib/apr/format";
import { carregarApr } from "@/lib/apr/repo";
import { getUsuarioAtual } from "@/db/session";
import { DATABASE_UNAVAILABLE_MESSAGE } from "@/shared/errors/database-errors";

export const dynamic = "force-dynamic";

/** Read-only view of an APR (the list links here); editing stays at /apr/[id]/editar. */
export default async function AprDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [apr, usuario] = await Promise.all([
    carregarApr(id).catch((error: unknown) => {
      console.warn("Detalhe da APR: falha ao consultar o banco.", error);
      return undefined;
    }),
    getUsuarioAtual(),
  ]);
  if (apr === null) notFound();

  if (!apr) {
    return (
      <AppLayout>
        <Alert tone="warning" title="Não foi possível carregar a APR">{DATABASE_UNAVAILABLE_MESSAGE}</Alert>
        <Link href="/apr" className="text-[13px] font-medium text-slate-600 hover:underline">Voltar à lista</Link>
      </AppLayout>
    );
  }

  const obraNome = apr.obraCodigo ? `${apr.obraCodigo} · ${apr.obraNome}` : apr.obraNome;
  const linha = (rotulo: string, valor: string) => (
    <div>
      <dt className="text-xs text-slate-500">{rotulo}</dt>
      <dd className="font-medium text-slate-800">{valor}</dd>
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500 mb-2">
            <Link href="/apr" className="hover:underline">APR</Link> / {apr.codigo}
          </div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-3">
            {apr.codigo}
            <AprStatusBadge status={apr.status} etapa={apr.etapaAtual} />
          </h1>
          <p className="text-slate-600 mt-1">{apr.localObra || "Local não informado"}</p>
        </div>
        <AprPdfButton aprId={apr.id} codigo={apr.codigo} />
      </div>

      {apr.status === "reprovada" && apr.motivoReprovacao && (
        <Alert tone="danger" title="Devolvida para correção">{apr.motivoReprovacao}</Alert>
      )}

      <div className="mb-5">
        <AprAcoes
          aprId={apr.id}
          status={apr.status}
          perfil={usuario.perfil}
          usuarioId={usuario.id}
          autorId={apr.autorId}
          usuarioNome={usuario.nome}
        />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 mb-4">
        <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight mb-3">Controle</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {linha("Elaborada por", apr.autorNome ?? "—")}
          {linha("Criada em", formatarData(apr.criadoEm, true))}
          {linha("Enviada para aprovação", apr.submetidoEm ? formatarData(apr.submetidoEm, true) : "—")}
          {linha("Aprovada", apr.aprovadoEm ? `${apr.aprovadorNome ?? "—"} · ${formatarData(apr.aprovadoEm, true)}` : "—")}
        </dl>
      </section>

      <AprResumo draft={apr} obraNome={obraNome} />
    </AppLayout>
  );
}
