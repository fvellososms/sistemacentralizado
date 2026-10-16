"use client";

import { Badge } from "@/components/ui";
import { formatarData } from "@/lib/apr/format";
import { NivelBadge, TipoControleBadge } from "./shared";
import { PROBABILIDADE_LABEL, SEVERIDADE_LABEL, TIPO_CONTROLE_ORDEM, type AprDraft } from "@/lib/apr/types";

export function AprResumo({
  draft,
  obraNome,
  onEditar,
}: {
  draft: AprDraft;
  obraNome?: string | null;
  onEditar?: (etapa: number) => void;
}) {
  const totalRiscos = draft.atividades.reduce((s, a) => s + a.riscos.filter((r) => r.selecionado).length, 0);
  const totalControles = draft.atividades.reduce(
    (s, a) => s + a.riscos.filter((r) => r.selecionado).reduce((x, r) => x + r.controles.filter((c) => c.selecionado).length, 0),
    0,
  );

  const Secao = ({ titulo, etapa, children }: { titulo: string; etapa: number; children: React.ReactNode }) => (
    <section className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">{titulo}</h3>
        {onEditar && (
          <button type="button" onClick={() => onEditar(etapa)} className="text-sm font-medium text-border-slate-400 ring-slate-400 hover:underline">
            Editar
          </button>
        )}
      </div>
      {children}
    </section>
  );

  return (
    <div className="flex flex-col gap-4">
      <Secao titulo="Identificação" etapa={1}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Obra</dt>
            <dd className="font-medium text-slate-800">{obraNome ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Local / frente de serviço</dt>
            <dd className="font-medium text-slate-800">{draft.localObra || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Responsável</dt>
            <dd className="font-medium text-slate-800">{draft.responsavel || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Data de execução</dt>
            <dd className="text-[11px] font-mono text-slate-400 text-slate-800">{formatarData(draft.dataExecucao)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">Equipe</dt>
            <dd className="text-slate-800">{draft.equipe || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">Descrição do serviço</dt>
            <dd className="whitespace-pre-wrap text-slate-800">{draft.descricaoServico || "—"}</dd>
          </div>
        </dl>
      </Secao>

      <Secao titulo={`Atividades, riscos e controles (${draft.atividades.length} · ${totalRiscos} · ${totalControles})`} etapa={2}>
        {draft.atividades.length === 0 && <p className="text-sm text-slate-500">Nenhuma atividade selecionada.</p>}
        <div className="flex flex-col gap-4">
          {draft.atividades.map((a, i) => (
            <div key={a.key} className="rounded-lg border border-border-slate-200">
              <div className="flex flex-wrap items-center gap-2 border-b border-border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className="text-[11px] font-mono text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium text-slate-800">{a.nome}</span>
                {a.categoria && <Badge tone="neutral">{a.categoria}</Badge>}
                {a.origem === "manual" && <Badge tone="neutral">Manual</Badge>}
              </div>
              <ul className="divide-y divide-border-slate-200">
                {a.riscos
                  .filter((r) => r.selecionado)
                  .map((r) => {
                    const sel = r.controles.filter((c) => c.selecionado);
                    const removidos = r.controles.filter((c) => c.obrigatorio && !c.selecionado);
                    return (
                      <li key={r.key} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{r.nome}</span>
                          <NivelBadge probabilidade={r.probabilidade} severidade={r.severidade} />
                          <span className="text-xs text-slate-500">
                            P: {PROBABILIDADE_LABEL[r.probabilidade]} · S: {SEVERIDADE_LABEL[r.severidade]}
                          </span>
                          {r.nrs.map((n) => (
                            <Badge key={n} tone="neutral">
                              {n}
                            </Badge>
                          ))}
                        </div>
                        {sel.length === 0 ? (
                          <p className="mt-2 text-xs text-amber-700">Sem medidas de controle definidas.</p>
                        ) : (
                          <ul className="mt-2 flex flex-col gap-1">
                            {TIPO_CONTROLE_ORDEM.flatMap((tipo) =>
                              sel
                                .filter((c) => c.tipoControle === tipo)
                                .map((c) => (
                                  <li key={c.key} className="flex flex-wrap items-center gap-2 text-sm text-slate-800-secondary">
                                    <span className="text-text-emerald-600" aria-hidden>
                                      ✓
                                    </span>
                                    {c.nome}
                                    <TipoControleBadge tipo={c.tipoControle} />
                                    {c.obrigatorio && <span className="text-xs text-slate-500">obrigatória</span>}
                                  </li>
                                )),
                            )}
                          </ul>
                        )}
                        {removidos.length > 0 && (
                          <ul className="mt-2 flex flex-col gap-1">
                            {removidos.map((c) => (
                              <li key={c.key} className="rounded-md bg-bg-amber-50 text-amber-700 px-3 py-2 text-xs text-amber-900">
                                <span className="font-medium">Medida obrigatória removida:</span> {c.nome}
                                <span className="block">Justificativa: {c.justificativa || "—"}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}
