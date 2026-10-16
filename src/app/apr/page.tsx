import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { AprStatusBadge } from "@/components/apr/shared";
import { formatarData } from "@/lib/apr/format";
import { EmptyState } from "@/components/ui";
import { listarAprs } from "@/lib/apr/repo";
import { STATUS_LABEL, type AprStatus } from "@/lib/apr/types";
import { getObraAtual, listarObras, getUsuarioAtual } from "@/db/session";
import { NovaAprButton } from "@/components/apr/NovaAprButton";
import type { AprDraft } from "@/lib/apr/types";

export const dynamic = "force-dynamic";

const STATUS: AprStatus[] = ["rascunho", "aguardando_aprovacao", "aprovada", "reprovada"];

export default async function AprListaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const obraAtual = await getObraAtual();
  const obras = await listarObras();
  const usuario = await getUsuarioAtual();

  const inicial: AprDraft = {
    id: null,
    codigo: null,
    status: "rascunho",
    obraId: obraAtual?.id ?? null,
    localObra: "",
    responsavel: usuario.nome,
    equipe: "",
    dataExecucao: new Date().toISOString().slice(0, 10),
    descricaoServico: "",
    etapaAtual: 1,
    revisadaPeloAutor: false,
    atividades: [],
  };

  const obraParam = get("obraId");
  const obraId = obraParam === "todas" ? undefined : obraParam ? Number(obraParam) : obraAtual?.id;
  const status = STATUS.includes(get("status") as AprStatus) ? (get("status") as AprStatus) : undefined;

  const itens = await listarAprs({ obraId, status, atividade: get("atividade"), de: get("de"), ate: get("ate"), q: get("q") });

  const resumo = STATUS.map((s) => ({ s, n: itens.filter((i) => i.status === s).length }));

  return (
    <AppLayout>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Análise Preliminar de Riscos</h1>
          <p className="text-slate-600 mt-1">Histórico de APRs da obra, com situação de revisão e aprovação.</p>
        </div>
        <div>
          <NovaAprButton inicial={inicial} obraNome={obraAtual ? `${obraAtual.codigo} · ${obraAtual.nome}` : null} usuarioNome={usuario.nome} />
        </div>
      </div>


      {/* Resumo por situação */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {resumo.map(({ s, n }) => (
          <Link key={s} href={`/apr?status=${s}${obraParam ? `&obraId=${obraParam}` : ""}`} className={`bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 transition-colors hover:bg-slate-50 ${status === s ? "ring-2 ring-slate-400" : ""}`}>
            <p className="text-xs text-slate-500">{STATUS_LABEL[s]}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{n}</p>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <form method="get" className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden mb-5 grid grid-cols-1 gap-3 p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label htmlFor="q" className="block text-sm font-medium mb-1 text-slate-700">Buscar</label>
          <input id="q" name="q" defaultValue={get("q") ?? ""} placeholder="Código, local ou descrição" className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px]" />
        </div>
        <div>
          <label htmlFor="obraId" className="block text-sm font-medium mb-1 text-slate-700">Obra</label>
          <select id="obraId" name="obraId" defaultValue={obraParam ?? obraAtual?.id ?? "todas"} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px]">
            <option value="todas">Todas</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.codigo} · {o.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1 text-slate-700">Situação</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px]">
            <option value="">Todas</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="atividade" className="block text-sm font-medium mb-1 text-slate-700">Atividade</label>
          <input id="atividade" name="atividade" defaultValue={get("atividade") ?? ""} placeholder="Ex.: andaime" className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="de" className="block text-sm font-medium mb-1 text-slate-700">De</label>
            <input id="de" name="de" type="date" defaultValue={get("de") ?? ""} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px]" />
          </div>
          <div>
            <label htmlFor="ate" className="block text-sm font-medium mb-1 text-slate-700">Até</label>
            <input id="ate" name="ate" type="date" defaultValue={get("ate") ?? ""} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px]" />
          </div>
        </div>
        <div className="flex gap-2 md:col-span-6 md:justify-end">
          <Link href="/apr?obraId=todas" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">Limpar</Link>
          <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition">Aplicar filtros</button>
        </div>
      </form>

      {itens.length === 0 ? (
        <EmptyState
          title="Nenhuma APR encontrada"
          description="Ajuste os filtros ou inicie uma nova análise para esta obra."
          action={<NovaAprButton inicial={inicial} obraNome={obraAtual ? `${obraAtual.codigo} · ${obraAtual.nome}` : null} usuarioNome={usuario.nome} />}
        />
      ) : (
        <>
          {/* Lista mobile (cards) */}
          <ul className="flex flex-col gap-3 md:hidden">
            {itens.map((i) => (
              <li key={i.id}>
                <Link href={`/apr/${i.id}`} className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden block p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">{i.codigo}</span>
                    <AprStatusBadge status={i.status} etapa={i.etapaAtual} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-800">{i.descricaoServico}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {i.obraCodigo} · {i.localObra}
                  </p>
                  <p className="mt-2 text-xs text-slate-800-secondary">
                    {i.qtdAtividades} atividade(s) · {i.qtdRiscos} risco(s) · execução {formatarData(i.dataExecucao)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tabela desktop */}
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Serviço</th>
                  <th className="px-4 py-3 font-medium">Obra / local</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium">Execução</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                  <th className="px-4 py-3 font-medium">Atualizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-slate-200">
                {itens.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/apr/${i.id}`} className="text-[11px] font-mono text-slate-400 text-border-slate-400 ring-slate-400 hover:underline">{i.codigo}</Link>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <Link href={`/apr/${i.id}`} className="line-clamp-2 font-medium text-slate-800 hover:underline">{i.descricaoServico}</Link>
                      <span className="text-xs text-slate-500">por {i.autor ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800-secondary">
                      <span className="block text-xs text-slate-500">{i.obraCodigo} · {i.obraNome}</span>
                      {i.localObra}
                    </td>
                    <td className="px-4 py-3 text-slate-800-secondary">{i.qtdAtividades} atv · {i.qtdRiscos} riscos</td>
                    <td className="text-[11px] font-mono text-slate-400 px-4 py-3">{formatarData(i.dataExecucao)}</td>
                    <td className="px-4 py-3"><AprStatusBadge status={i.status} etapa={i.etapaAtual} /></td>
                    <td className="text-[11px] font-mono text-slate-400 px-4 py-3">{formatarData(i.atualizadoEm.toISOString(), true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
