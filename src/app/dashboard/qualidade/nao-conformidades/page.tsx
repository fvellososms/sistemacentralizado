"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileWarning, Mail, Plus, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import {
  NC_GRAUS,
  NC_SITUACOES,
  NC_TIPOS,
  diasAtePrazo,
  getNcSituacao,
  validateNaoConformidade,
  type NaoConformidadeErrors,
  type NaoConformidadeInput,
  type NcGrau,
  type NcSituacao,
  type NcTipo,
} from "@/modules/quality";

interface NaoConformidade extends NaoConformidadeInput {
  id: number;
  status: string;
  resolvidaEm: string | null;
}

const hojeIso = () => new Date().toISOString().slice(0, 10);

const formatarData = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const GRAU_STYLE: Record<NcGrau, string> = {
  baixa: "bg-slate-100 text-slate-700 border-slate-200",
  media: "bg-amber-50 text-amber-800 border-amber-200",
  grave: "bg-red-50 text-red-700 border-red-200",
};

const SITUACAO_STYLE: Record<NcSituacao, string> = {
  aberta: "bg-blue-50 text-blue-700 border-blue-100",
  vencida: "bg-red-50 text-red-700 border-red-100",
  resolvida: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const inputClass =
  "w-full px-3.5 py-2.5 text-[13px] rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition placeholder:text-slate-400";
const labelClass = "block text-[11.5px] font-semibold text-slate-700 mb-1.5";

export default function NaoConformidadesPage() {
  const { activeProject } = useApp();
  const [itens, setItens] = useState<NaoConformidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [resolvendoId, setResolvendoId] = useState<number | null>(null);
  const hoje = hojeIso();

  const carregar = useCallback(async () => {
    if (!activeProject) return;
    setCarregando(true);
    try {
      const res = await fetch(`/api/qualidade/nao-conformidades?projectId=${activeProject.id}`);
      const data = await res.json();
      setItens(Array.isArray(data.naoConformidades) ? data.naoConformidades : []);
    } catch {
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }, [activeProject]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resumo = useMemo(() => {
    const contagem: Record<NcSituacao, number> = { aberta: 0, vencida: 0, resolvida: 0 };
    for (const nc of itens) contagem[getNcSituacao(nc, hoje)]++;
    return contagem;
  }, [itens, hoje]);

  const marcarResolvida = async (id: number) => {
    setResolvendoId(id);
    try {
      const res = await fetch(`/api/qualidade/nao-conformidades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolvida" }),
      });
      if (res.ok) await carregar();
    } finally {
      setResolvendoId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link
              href="/dashboard/qualidade"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à Qualidade</span>
            </Link>
            <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileWarning className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
              </div>
              <span>Não conformidades</span>
            </h1>
            <p className="text-[12.5px] text-slate-500 mt-1">
              Registro e acompanhamento das NCs da obra {activeProject ? `“${activeProject.name}”` : "ativa"}.
            </p>
          </div>
          <Button onClick={() => setModalAberto(true)}>
            <Plus className="w-4 h-4" />
            Nova não conformidade
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(NC_SITUACOES) as NcSituacao[]).map((s) => (
            <div key={s} className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <p className="text-[11.5px] font-medium text-slate-500">{NC_SITUACOES[s]}s</p>
              <p className={`mt-1 text-2xl font-semibold ${s === "vencida" && resumo[s] > 0 ? "text-red-600" : "text-slate-900"}`}>
                {resumo[s]}
              </p>
            </div>
          ))}
        </div>

        {carregando ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-[13px] text-slate-500">
            Carregando não conformidades…
          </div>
        ) : itens.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-300 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900">Nenhuma não conformidade registrada</h2>
            <p className="text-[12.5px] text-slate-500 mt-1 max-w-sm">
              Quando uma NC for identificada nesta obra, registre aqui para acompanhar o prazo de resolução.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {itens.map((nc) => {
              const situacao = getNcSituacao(nc, hoje);
              const dias = diasAtePrazo(nc.prazo, hoje);
              return (
                <li key={nc.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${SITUACAO_STYLE[situacao]}`}>
                          {NC_SITUACOES[situacao]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${GRAU_STYLE[nc.grau]}`}>
                          Grau {NC_GRAUS[nc.grau]?.toLowerCase() ?? nc.grau}
                        </span>
                        <span className="text-[11.5px] text-slate-500">{NC_TIPOS[nc.tipo] ?? nc.tipo}</span>
                      </div>
                      <h3 className="mt-2 text-[14px] font-semibold text-slate-900">{nc.titulo}</h3>
                      <p className="mt-1 text-[12.5px] text-slate-600 whitespace-pre-line">{nc.descricao}</p>
                      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
                        <div className="flex gap-1.5"><dt className="text-slate-500">Local:</dt><dd className="text-slate-800 font-medium">{nc.localObra}</dd></div>
                        <div className="flex gap-1.5"><dt className="text-slate-500">Requisito:</dt><dd className="text-slate-800 font-medium">{nc.requisitoViolado}</dd></div>
                        <div className="flex gap-1.5"><dt className="text-slate-500">Ocorrência:</dt><dd className="text-slate-800 font-medium">{formatarData(nc.dataOcorrencia)}</dd></div>
                        <div className="flex gap-1.5">
                          <dt className="text-slate-500">Prazo:</dt>
                          <dd className={`font-medium ${situacao === "vencida" ? "text-red-600" : "text-slate-800"}`}>
                            {formatarData(nc.prazo)}
                            {situacao !== "resolvida" &&
                              ` · ${dias < 0 ? `vencida há ${-dias} dia(s)` : dias === 0 ? "vence hoje" : `faltam ${dias} dia(s)`}`}
                          </dd>
                        </div>
                        <div className="flex gap-1.5 sm:col-span-2">
                          <dt className="text-slate-500">Responsável:</dt>
                          <dd className="text-slate-800 font-medium">
                            {nc.responsavelNome} ·{" "}
                            <a href={`mailto:${nc.responsavelEmail}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <Mail className="w-3 h-3" />
                              {nc.responsavelEmail}
                            </a>
                          </dd>
                        </div>
                      </dl>
                    </div>
                    {situacao !== "resolvida" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={resolvendoId === nc.id}
                        onClick={() => void marcarResolvida(nc.id)}
                        className="shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marcar como resolvida
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalAberto && (
        <NovaNcModal
          onClose={() => setModalAberto(false)}
          onSaved={() => {
            setModalAberto(false);
            void carregar();
          }}
        />
      )}
    </AppLayout>
  );
}

function NovaNcModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { projects, activeProject } = useApp();
  const hoje = hojeIso();
  const [form, setForm] = useState<Partial<NaoConformidadeInput>>(() => ({
    projectId: activeProject?.id,
    responsavelNome: activeProject?.managerName ?? "",
    responsavelEmail: "",
    dataOcorrencia: hoje,
    grau: "media",
  }));
  const [erros, setErros] = useState<NaoConformidadeErrors>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const set = <K extends keyof NaoConformidadeInput>(k: K, v: NaoConformidadeInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined }));
  };

  const trocarObra = (id: number) => {
    const obra = projects.find((p) => p.id === id);
    setForm((f) => ({ ...f, projectId: id, responsavelNome: obra?.managerName ?? f.responsavelNome }));
    setErros((e) => ({ ...e, projectId: undefined }));
  };

  const salvar = async () => {
    const { isValid, errors } = validateNaoConformidade(form, hoje);
    setErros(errors);
    if (!isValid) return;
    setSalvando(true);
    setErroGeral(null);
    try {
      const obra = projects.find((p) => p.id === form.projectId);
      const res = await fetch("/api/qualidade/nao-conformidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectName: obra?.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao registrar a não conformidade.");
      onSaved();
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Falha ao registrar a não conformidade.");
    } finally {
      setSalvando(false);
    }
  };

  const campo = (k: keyof NaoConformidadeInput) => `${inputClass} ${erros[k] ? "border-red-300" : "border-slate-200"}`;
  const erro = (k: keyof NaoConformidadeInput) =>
    erros[k] ? <p className="text-[11.5px] text-red-600 mt-1">{erros[k]}</p> : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nova-nc-titulo"
        className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex-none px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Qualidade</span>
            <h2 id="nova-nc-titulo" className="text-[15px] font-semibold text-slate-900 mt-0.5">Nova não conformidade</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
          {erroGeral && (
            <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">
              {erroGeral}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-slate-900">Classificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nc-obra" className={labelClass}>Obra *</label>
                <select
                  id="nc-obra"
                  value={form.projectId ?? ""}
                  onChange={(e) => trocarObra(Number(e.target.value))}
                  className={campo("projectId")}
                >
                  <option value="" disabled>Selecione a obra</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                  ))}
                </select>
                {erro("projectId")}
              </div>
              <div>
                <label htmlFor="nc-tipo" className={labelClass}>Tipo da NC *</label>
                <select
                  id="nc-tipo"
                  value={form.tipo ?? ""}
                  onChange={(e) => set("tipo", e.target.value as NcTipo)}
                  className={campo("tipo")}
                >
                  <option value="" disabled>Selecione o tipo</option>
                  {(Object.keys(NC_TIPOS) as NcTipo[]).map((t) => (
                    <option key={t} value={t}>{NC_TIPOS[t]}</option>
                  ))}
                </select>
                {erro("tipo")}
              </div>
              <div>
                <span className={labelClass} id="nc-grau-label">Grau *</span>
                <div role="radiogroup" aria-labelledby="nc-grau-label" className="grid grid-cols-3 gap-2">
                  {(Object.keys(NC_GRAUS) as NcGrau[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={form.grau === g}
                      onClick={() => set("grau", g)}
                      className={`px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition ${
                        form.grau === g ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      {NC_GRAUS[g]}
                    </button>
                  ))}
                </div>
                {erro("grau")}
              </div>
              <div>
                <label htmlFor="nc-data" className={labelClass}>Data da ocorrência *</label>
                <input
                  id="nc-data"
                  type="date"
                  max={hoje}
                  value={form.dataOcorrencia ?? ""}
                  onChange={(e) => set("dataOcorrencia", e.target.value)}
                  className={campo("dataOcorrencia")}
                />
                {erro("dataOcorrencia")}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-slate-900">Descrição da NC</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nc-local" className={labelClass}>Local da obra *</label>
                <input
                  id="nc-local"
                  placeholder="Ex.: Bloco A · 5º pavimento"
                  value={form.localObra ?? ""}
                  onChange={(e) => set("localObra", e.target.value)}
                  className={campo("localObra")}
                />
                {erro("localObra")}
              </div>
              <div>
                <label htmlFor="nc-requisito" className={labelClass}>Requisito violado *</label>
                <input
                  id="nc-requisito"
                  placeholder="Norma, procedimento ou cláusula (ex.: NR-18, item 18.13.1)"
                  value={form.requisitoViolado ?? ""}
                  onChange={(e) => set("requisitoViolado", e.target.value)}
                  className={campo("requisitoViolado")}
                />
                {erro("requisitoViolado")}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nc-titulo" className={labelClass}>Título *</label>
                <input
                  id="nc-titulo"
                  maxLength={255}
                  placeholder="Resumo curto da não conformidade"
                  value={form.titulo ?? ""}
                  onChange={(e) => set("titulo", e.target.value)}
                  className={campo("titulo")}
                />
                {erro("titulo")}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nc-descricao" className={labelClass}>Descrição da NC *</label>
                <textarea
                  id="nc-descricao"
                  rows={4}
                  placeholder={"O que: o que foi constatado\nOnde: local exato\nQuando: data, horário ou etapa do serviço"}
                  value={form.descricao ?? ""}
                  onChange={(e) => set("descricao", e.target.value)}
                  className={`${campo("descricao")} resize-y`}
                />
                {erro("descricao")}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-slate-900">Responsável e prazo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="nc-resp-nome" className={labelClass}>Responsável pela obra *</label>
                <input
                  id="nc-resp-nome"
                  value={form.responsavelNome ?? ""}
                  onChange={(e) => set("responsavelNome", e.target.value)}
                  className={campo("responsavelNome")}
                />
                {erro("responsavelNome")}
              </div>
              <div>
                <label htmlFor="nc-resp-email" className={labelClass}>E-mail do responsável *</label>
                <input
                  id="nc-resp-email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  value={form.responsavelEmail ?? ""}
                  onChange={(e) => set("responsavelEmail", e.target.value)}
                  className={campo("responsavelEmail")}
                />
                {erro("responsavelEmail")}
              </div>
              <div>
                <label htmlFor="nc-prazo" className={labelClass}>Prazo para resolver *</label>
                <input
                  id="nc-prazo"
                  type="date"
                  min={form.dataOcorrencia || undefined}
                  value={form.prazo ?? ""}
                  onChange={(e) => set("prazo", e.target.value)}
                  className={campo("prazo")}
                />
                {erro("prazo")}
              </div>
            </div>
          </section>
        </div>

        <div className="flex-none px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void salvar()} loading={salvando}>
            <CheckCircle2 className="w-4 h-4" />
            Registrar NC
          </Button>
        </div>
      </div>
    </div>
  );
}
