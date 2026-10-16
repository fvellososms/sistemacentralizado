"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, EmptyState, Input, Select, Textarea, useToast } from "@/components/ui";
import { TipoControleBadge } from "./shared";
import { formatarData } from "@/lib/apr/format";
import type { BaseDados } from "@/lib/apr/base";
import { PROBABILIDADE_LABEL, SEVERIDADE_LABEL, TIPO_CONTROLE_LABEL, TIPO_CONTROLE_ORDEM, type Probabilidade, type Severidade, type TipoControle } from "@/lib/apr/types";

type Aba = "atividades" | "riscos" | "controles" | "buscas";
type AtividadeItem = BaseDados["atividades"][number];
type RiscoItem = BaseDados["riscos"][number];
type ControleItem = BaseDados["controles"][number];

export function BaseConhecimento({ dados }: { dados: BaseDados }) {
  const router = useRouter();
  const toast = useToast();
  const [aba, setAba] = useState<Aba>("atividades");
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<{ tipo: Aba; item: unknown } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(tipo: string, item: unknown, msg: string) {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo, item }) });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Falha ao salvar.");
      toast.push(msg, "success");
      setEditando(null);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de comunicação.");
    } finally {
      setSalvando(false);
    }
  }

  const f = filtro.trim().toLowerCase();
  const atvs = useMemo(() => dados.atividades.filter((a) => !f || a.nome.toLowerCase().includes(f) || a.termos.some((t) => t.toLowerCase().includes(f))), [dados, f]);
  const rscs = useMemo(() => dados.riscos.filter((r) => !f || r.nome.toLowerCase().includes(f)), [dados, f]);
  const ctrls = useMemo(() => dados.controles.filter((c) => !f || c.nome.toLowerCase().includes(f)), [dados, f]);

  const abas: { id: Aba; label: string; n: number }[] = [
    { id: "atividades", label: "Atividades", n: dados.atividades.length },
    { id: "riscos", label: "Riscos", n: dados.riscos.length },
    { id: "controles", label: "Medidas de controle", n: dados.controles.length },
    { id: "buscas", label: "Buscas sem resultado", n: dados.buscas.length },
  ];

  const novo = () => {
    if (aba === "atividades") setEditando({ tipo: aba, item: { nome: "", categoria: "", descricao: "", ativo: true, termos: [], riscos: [] } satisfies Omit<AtividadeItem, "id" | "criadoEm"> });
    if (aba === "riscos") setEditando({ tipo: aba, item: { nome: "", descricao: "", ativo: true, nrIds: [], controles: [] } });
    if (aba === "controles") setEditando({ tipo: aba, item: { nome: "", descricao: "", tipoControle: "administrativo", ativo: true } });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {abas.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => {
                setAba(a.id);
                setEditando(null);
              }}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium ${aba === a.id ? "bg-border-slate-400 ring-slate-400-soft text-border-slate-400 ring-slate-400" : "text-slate-800-secondary hover:bg-slate-50"}`}
            >
              {a.label}
              <Badge tone={a.id === "buscas" && a.n > 0 ? "warning" : "neutral"}>{a.n}</Badge>
            </button>
          ))}
        </div>
        {aba !== "buscas" && (
          <div className="flex gap-2">
            <input aria-label="Filtrar" placeholder="Filtrar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px] sm:w-56" />
            <Button variant="primary" onClick={novo}>
              + Novo
            </Button>
          </div>
        )}
      </div>

      {erro && (
        <Alert tone="danger" title="Falha ao salvar" action={<Button size="sm" variant="secondary" onClick={() => setErro(null)}>Fechar</Button>}>
          {erro}
        </Alert>
      )}

      {editando?.tipo === "atividades" && (
        <FormAtividade
          inicial={editando.item as Partial<AtividadeItem>}
          riscos={dados.riscos}
          salvando={salvando}
          onCancelar={() => setEditando(null)}
          onSalvar={(it) => void salvar("atividade", it, "Atividade salva.")}
        />
      )}
      {editando?.tipo === "riscos" && (
        <FormRisco
          inicial={editando.item as Partial<RiscoItem>}
          nrs={dados.nrs}
          controles={dados.controles}
          salvando={salvando}
          onCancelar={() => setEditando(null)}
          onSalvar={(it) => void salvar("risco", it, "Risco salvo.")}
        />
      )}
      {editando?.tipo === "controles" && (
        <FormControle
          inicial={editando.item as Partial<ControleItem>}
          salvando={salvando}
          onCancelar={() => setEditando(null)}
          onSalvar={(it) => void salvar("controle", it, "Medida de controle salva.")}
        />
      )}

      {aba === "atividades" && (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {atvs.map((a) => (
            <li key={a.id} className={`bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 ${a.ativo ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{a.nome}</p>
                  <p className="text-xs text-slate-500">{a.categoria ?? "Sem categoria"} · {a.riscos.length} risco(s) · {a.termos.length} termo(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  {!a.ativo && <Badge tone="neutral">Inativa</Badge>}
                  <Button size="sm" variant="secondary" onClick={() => setEditando({ tipo: "atividades", item: a })}>Editar</Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.termos.slice(0, 8).map((t) => (
                  <Badge key={t} tone="neutral">{t}</Badge>
                ))}
                {a.termos.length > 8 && <Badge tone="neutral">+{a.termos.length - 8}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {aba === "riscos" && (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rscs.map((r) => (
            <li key={r.id} className={`bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 ${r.ativo ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{r.nome}</p>
                  <p className="text-xs text-slate-500">
                    {r.nrIds.map((id) => dados.nrs.find((n) => n.id === id)?.codigo).filter(Boolean).join(", ") || "Sem NR"} · {r.controles.length} medida(s) · {r.controles.filter((c) => c.obrigatorio).length} obrigatória(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!r.ativo && <Badge tone="neutral">Inativo</Badge>}
                  <Button size="sm" variant="secondary" onClick={() => setEditando({ tipo: "riscos", item: r })}>Editar</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aba === "controles" && (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ctrls.map((c) => (
            <li key={c.id} className={`bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex items-start justify-between gap-3 p-4 ${c.ativo ? "" : "opacity-60"}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{c.nome}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <TipoControleBadge tipo={c.tipoControle} />
                  {!c.ativo && <Badge tone="neutral">Inativa</Badge>}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditando({ tipo: "controles", item: c })}>Editar</Button>
            </li>
          ))}
        </ul>
      )}

      {aba === "buscas" && (
        <BuscasPendentes buscas={dados.buscas} atividades={dados.atividades} salvando={salvando} onSalvar={salvar} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulários
// ---------------------------------------------------------------------------
function Acoes({ onCancelar, salvando }: { onCancelar: () => void; salvando: boolean }) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancelar} disabled={salvando}>Cancelar</Button>
      <Button variant="primary" type="submit" loading={salvando}>Salvar</Button>
    </div>
  );
}

function FormAtividade({ inicial, riscos, salvando, onCancelar, onSalvar }: { inicial: Partial<AtividadeItem>; riscos: RiscoItem[]; salvando: boolean; onCancelar: () => void; onSalvar: (it: unknown) => void }) {
  const [nome, setNome] = useState(inicial.nome ?? "");
  const [categoria, setCategoria] = useState(inicial.categoria ?? "");
  const [descricao, setDescricao] = useState(inicial.descricao ?? "");
  const [ativo, setAtivo] = useState(inicial.ativo ?? true);
  const [termos, setTermos] = useState((inicial.termos ?? []).join("\n"));
  const [sel, setSel] = useState<Record<number, { probabilidade: string; severidade: string }>>(Object.fromEntries((inicial.riscos ?? []).map((r) => [r.riscoId, { probabilidade: r.probabilidade, severidade: r.severidade }])));
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [filtroR, setFiltroR] = useState("");

  return (
    <form
      className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return setErroNome("Informe o nome da atividade.");
        onSalvar({ id: inicial.id, nome, categoria, descricao, ativo, termos: termos.split(/[\n,;]/), riscos: Object.entries(sel).map(([riscoId, v]) => ({ riscoId: Number(riscoId), ...v })) });
      }}
    >
      <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">{inicial.id ? "Editar atividade" : "Nova atividade"}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Nome" required value={nome} onChange={(e) => { setNome(e.target.value); setErroNome(undefined); }} error={erroNome} />
        <Input label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: Estrutura" />
        <Textarea className="md:col-span-2" label="Descrição" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <Textarea className="md:col-span-2" label="Termos e sinônimos de busca" rows={3} value={termos} onChange={(e) => setTermos(e.target.value)} help="Um por linha ou separados por vírgula. Usados pela busca inteligente." />
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input type="checkbox" className="h-5 w-5 accent-border-slate-400 ring-slate-400" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativa (aparece nas sugestões)
        </label>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="block text-sm font-medium mb-1 text-slate-700 mb-0">Riscos associados ({Object.keys(sel).length})</p>
          <input aria-label="Filtrar riscos" placeholder="Filtrar riscos…" value={filtroR} onChange={(e) => setFiltroR(e.target.value)} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px] max-w-xs" />
        </div>
        <ul className="max-h-80 divide-y divide-border-slate-200 overflow-y-auto rounded-lg border border-border-slate-200">
          {riscos.filter((r) => r.ativo && (!filtroR || r.nome.toLowerCase().includes(filtroR.toLowerCase()))).map((r) => {
            const on = Boolean(sel[r.id]);
            return (
              <li key={r.id} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
                <label className="flex flex-1 items-center gap-2 text-sm text-slate-800">
                  <input type="checkbox" className="h-5 w-5 accent-border-slate-400 ring-slate-400" checked={on} onChange={(e) => setSel((s) => { const n = { ...s }; if (e.target.checked) n[r.id] = { probabilidade: "media", severidade: "moderada" }; else delete n[r.id]; return n; })} />
                  {r.nome}
                </label>
                {on && (
                  <div className="flex gap-2 pl-7 sm:pl-0">
                    <select aria-label="Probabilidade" className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px] min-h-9 py-1 text-xs" value={sel[r.id].probabilidade} onChange={(e) => setSel((s) => ({ ...s, [r.id]: { ...s[r.id], probabilidade: e.target.value } }))}>
                      {(Object.keys(PROBABILIDADE_LABEL) as Probabilidade[]).map((p) => <option key={p} value={p}>P: {PROBABILIDADE_LABEL[p]}</option>)}
                    </select>
                    <select aria-label="Severidade" className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px] min-h-9 py-1 text-xs" value={sel[r.id].severidade} onChange={(e) => setSel((s) => ({ ...s, [r.id]: { ...s[r.id], severidade: e.target.value } }))}>
                      {(Object.keys(SEVERIDADE_LABEL) as Severidade[]).map((p) => <option key={p} value={p}>S: {SEVERIDADE_LABEL[p]}</option>)}
                    </select>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <Acoes onCancelar={onCancelar} salvando={salvando} />
    </form>
  );
}

function FormRisco({ inicial, nrs, controles, salvando, onCancelar, onSalvar }: { inicial: Partial<RiscoItem>; nrs: BaseDados["nrs"]; controles: ControleItem[]; salvando: boolean; onCancelar: () => void; onSalvar: (it: unknown) => void }) {
  const [nome, setNome] = useState(inicial.nome ?? "");
  const [descricao, setDescricao] = useState(inicial.descricao ?? "");
  const [ativo, setAtivo] = useState(inicial.ativo ?? true);
  const [nrIds, setNrIds] = useState<number[]>(inicial.nrIds ?? []);
  const [sel, setSel] = useState<Record<number, boolean>>(Object.fromEntries((inicial.controles ?? []).map((c) => [c.controleId, c.obrigatorio])));
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [filtroC, setFiltroC] = useState("");

  return (
    <form
      className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return setErroNome("Informe o nome do risco.");
        onSalvar({ id: inicial.id, nome, descricao, ativo, nrIds, controles: Object.entries(sel).map(([controleId, obrigatorio]) => ({ controleId: Number(controleId), obrigatorio })) });
      }}
    >
      <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">{inicial.id ? "Editar risco" : "Novo risco"}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Nome" required value={nome} onChange={(e) => { setNome(e.target.value); setErroNome(undefined); }} error={erroNome} />
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-800">
          <input type="checkbox" className="h-5 w-5 accent-border-slate-400 ring-slate-400" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativo
        </label>
        <Textarea className="md:col-span-2" label="Descrição" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="mt-5">
        <p className="block text-sm font-medium mb-1 text-slate-700">Normas Regulamentadoras aplicáveis</p>
        <div className="flex flex-wrap gap-2">
          {nrs.map((n) => {
            const on = nrIds.includes(n.id);
            return (
              <label key={n.id} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${on ? "border-border-slate-400 ring-slate-400 bg-border-slate-400 ring-slate-400-soft text-border-slate-400 ring-slate-400" : "border-border-slate-200 text-slate-800-secondary"}`} title={n.descricao}>
                <input type="checkbox" className="sr-only" checked={on} onChange={(e) => setNrIds((s) => (e.target.checked ? [...s, n.id] : s.filter((x) => x !== n.id)))} />
                {n.codigo}
              </label>
            );
          })}
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="block text-sm font-medium mb-1 text-slate-700 mb-0">Medidas de controle ({Object.keys(sel).length})</p>
          <input aria-label="Filtrar medidas" placeholder="Filtrar medidas…" value={filtroC} onChange={(e) => setFiltroC(e.target.value)} className="border border-slate-300 rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none text-[13px] max-w-xs" />
        </div>
        <ul className="max-h-80 divide-y divide-border-slate-200 overflow-y-auto rounded-lg border border-border-slate-200">
          {TIPO_CONTROLE_ORDEM.flatMap((tipo) =>
            controles.filter((c) => c.ativo && c.tipoControle === tipo && (!filtroC || c.nome.toLowerCase().includes(filtroC.toLowerCase()))).map((c) => {
              const on = c.id in sel;
              return (
                <li key={c.id} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
                  <label className="flex flex-1 items-center gap-2 text-sm text-slate-800">
                    <input type="checkbox" className="h-5 w-5 accent-border-slate-400 ring-slate-400" checked={on} onChange={(e) => setSel((s) => { const n = { ...s }; if (e.target.checked) n[c.id] = false; else delete n[c.id]; return n; })} />
                    <span className="flex-1">{c.nome}</span>
                    <TipoControleBadge tipo={c.tipoControle} />
                  </label>
                  {on && (
                    <label className="flex items-center gap-2 pl-7 text-xs text-slate-800-secondary sm:pl-0">
                      <input type="checkbox" className="h-4 w-4 accent-border-slate-400 ring-slate-400" checked={sel[c.id]} onChange={(e) => setSel((s) => ({ ...s, [c.id]: e.target.checked }))} /> Obrigatória
                    </label>
                  )}
                </li>
              );
            }),
          )}
        </ul>
      </div>
      <Acoes onCancelar={onCancelar} salvando={salvando} />
    </form>
  );
}

function FormControle({ inicial, salvando, onCancelar, onSalvar }: { inicial: Partial<ControleItem>; salvando: boolean; onCancelar: () => void; onSalvar: (it: unknown) => void }) {
  const [nome, setNome] = useState(inicial.nome ?? "");
  const [descricao, setDescricao] = useState(inicial.descricao ?? "");
  const [tipo, setTipo] = useState<TipoControle>(inicial.tipoControle ?? "administrativo");
  const [ativo, setAtivo] = useState(inicial.ativo ?? true);
  const [erroNome, setErroNome] = useState<string | undefined>();
  return (
    <form
      className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return setErroNome("Informe o nome da medida.");
        onSalvar({ id: inicial.id, nome, descricao, tipoControle: tipo, ativo });
      }}
    >
      <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">{inicial.id ? "Editar medida de controle" : "Nova medida de controle"}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Nome" required value={nome} onChange={(e) => { setNome(e.target.value); setErroNome(undefined); }} error={erroNome} />
        <Select label="Tipo (hierarquia de controles)" required value={tipo} onChange={(e) => setTipo(e.target.value as TipoControle)}>
          {TIPO_CONTROLE_ORDEM.map((t) => <option key={t} value={t}>{TIPO_CONTROLE_LABEL[t]}</option>)}
        </Select>
        <Textarea className="md:col-span-2" label="Descrição" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input type="checkbox" className="h-5 w-5 accent-border-slate-400 ring-slate-400" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativa
        </label>
      </div>
      <Acoes onCancelar={onCancelar} salvando={salvando} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Buscas sem resultado satisfatório (CDU06)
// ---------------------------------------------------------------------------
function BuscasPendentes({ buscas, atividades, salvando, onSalvar }: { buscas: BaseDados["buscas"]; atividades: AtividadeItem[]; salvando: boolean; onSalvar: (tipo: string, item: unknown, msg: string) => Promise<void> }) {
  const [alvo, setAlvo] = useState<Record<number, number>>({});
  const [termo, setTermo] = useState<Record<number, string>>({});
  if (buscas.length === 0) return <EmptyState title="Nenhuma busca pendente" description="Todas as buscas abaixo do limiar de confiança já foram revisadas." />;
  return (
    <div className="flex flex-col gap-3">
      <Alert tone="info" title="Como usar">
        Cada item é uma descrição que não encontrou atividade com confiança suficiente. Cadastre o termo em uma atividade existente ou crie uma nova atividade na aba correspondente e marque como revisada.
      </Alert>
      <ul className="flex flex-col gap-3">
        {buscas.map((b) => (
          <li key={b.id} className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="text-[11px] font-mono text-slate-400">{formatarData(b.criadoEm, true)}</span>
              <span>· {b.usuario ?? "—"}</span>
              <Badge tone="warning">score {b.melhorScore.toFixed(2)}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-800">“{b.textoBusca}”</p>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <Select label="Atividade de destino" value={alvo[b.id] ?? ""} onChange={(e) => setAlvo((s) => ({ ...s, [b.id]: Number(e.target.value) }))}>
                <option value="">Selecione…</option>
                {atividades.filter((a) => a.ativo).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </Select>
              <Input label="Novo termo / sinônimo" value={termo[b.id] ?? ""} onChange={(e) => setTermo((s) => ({ ...s, [b.id]: e.target.value }))} placeholder="Ex.: passar fiação" />
              <Button variant="primary" disabled={!alvo[b.id] || !termo[b.id]?.trim()} loading={salvando} onClick={() => void onSalvar("termo", { atividadeId: alvo[b.id], termo: termo[b.id], buscaId: b.id }, "Termo cadastrado e busca marcada como revisada.")}>
                Cadastrar termo
              </Button>
              <Button variant="ghost" disabled={salvando} onClick={() => void onSalvar("busca_revisada", { id: b.id }, "Busca marcada como revisada.")}>
                Marcar revisada
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
