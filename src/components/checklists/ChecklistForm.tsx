"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, History, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { comprimirFoto } from "@/components/quality/compress-photo";
import { downloadPdf } from "@/components/documents/PdfDownloadButton";
import { Panel, inputClass, labelClass, readApiError, useFetched } from "@/components/workspace/shared";
import {
  CHECKLIST_FOTOS_MAX,
  PERIODICIDADES,
  RESPOSTAS,
  RESPOSTA_PADRAO,
  iconePublico,
  type ChecklistItem,
  type Resposta,
} from "@/modules/checklists";
import type { Project } from "@/modules/projects";
import { SignaturePad } from "./SignaturePad";

const CHAVE_RASCUNHO = "fvcheck_rascunho";
const FOTO_MAIOR_LADO = 1280; // enough for the document and light on the free storage quota
const FOTO_QUALIDADE = 0.72;

interface ModeloResumo {
  id: number;
  nome: string;
  totalItens: number;
}
type RespostaItem = { resposta: Resposta; comentario: string };

const CAMPOS_VAZIOS = {
  numero: "",
  revisao: "",
  contratada: "",
  subcontratada: "",
  local: "",
  grupo: "",
  frente: "",
  objeto: "",
  tag: "",
  periodicidadeOpcao: "Rotineira",
  periodicidadeOutros: "",
  inspetor: "",
  dataInspecao: "",
  nomeTecnico: "",
  nomeOperador: "",
};
type Campos = typeof CAMPOS_VAZIOS;

/** Text fields and answers survive a closed screen or a reload on this device (photos and signatures do not). */
interface Rascunho {
  salvoEm: string;
  clientId: string;
  modeloId: number | null;
  campos: Campos;
  respostas: Record<string, RespostaItem>;
}

const hojeIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const agoraBr = () => new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

function lerRascunho(): Rascunho | null {
  try {
    const bruto = localStorage.getItem(CHAVE_RASCUNHO);
    return bruto ? (JSON.parse(bruto) as Rascunho) : null;
  } catch {
    return null;
  }
}

async function carregarModelos(): Promise<ModeloResumo[]> {
  const res = await fetch("/api/qualidade/checklists");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar os checklists."));
  return (await res.json()).modelos ?? [];
}

const NENHUM_MODELO: ModeloResumo[] = [];
const SEM_ITENS: ChecklistItem[] = [];
const ESTILO_RESPOSTA: Record<Resposta, string> = {
  Conforme: "border-emerald-500 bg-emerald-50 text-emerald-800",
  "Não conforme": "border-red-500 bg-red-50 text-red-800",
  "Não se aplica": "border-slate-400 bg-slate-100 text-slate-700",
};

const ItemChecklist = memo(function ItemChecklist({
  numero,
  item,
  valor,
  onResposta,
  onComentario,
}: {
  numero: number;
  item: ChecklistItem;
  valor: RespostaItem;
  onResposta: (numero: number, r: Resposta) => void;
  onComentario: (numero: number, c: string) => void;
}) {
  return (
    <li className="px-4 sm:px-6 py-4">
      <div className="flex items-start gap-2.5">
        <span className="text-[12px] font-semibold text-slate-400 tabular-nums mt-0.5">{numero}.</span>
        {item.icone && (
          // eslint-disable-next-line @next/next/no-img-element -- small static symbol
          <img src={iconePublico(item.icone)} alt="" width={32} height={32} className="shrink-0" />
        )}
        <p className="text-[13.5px] font-medium text-slate-900">{item.pergunta}</p>
      </div>
      <div role="radiogroup" aria-label={`Resposta do item ${numero}`} className="mt-2.5 grid grid-cols-3 gap-2">
        {RESPOSTAS.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={valor.resposta === r}
            onClick={() => onResposta(numero, r)}
            className={`px-2 py-2.5 rounded-xl border text-[12.5px] font-semibold transition ${
              valor.resposta === r ? ESTILO_RESPOSTA[r] : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <input
        value={valor.comentario}
        maxLength={1000}
        onChange={(e) => onComentario(numero, e.target.value)}
        placeholder="Comentário (opcional)"
        aria-label={`Comentário do item ${numero}`}
        className={`${inputClass} border-slate-200 mt-2`}
      />
    </li>
  );
});

export function ChecklistForm({
  projeto,
  inspetorPadrao,
  onCancelar,
  onSalvo,
}: {
  projeto: Project;
  inspetorPadrao: string;
  onCancelar: () => void;
  onSalvo: (mensagem: string) => void;
}) {
  const [rascunhoInicial] = useState(lerRascunho);
  const [restauradoEm, setRestauradoEm] = useState(rascunhoInicial?.salvoEm ?? null);
  const [clientId, setClientId] = useState(() => rascunhoInicial?.clientId ?? crypto.randomUUID());
  const [modeloId, setModeloId] = useState<number | null>(rascunhoInicial?.modeloId ?? null);
  const [campos, setCampos] = useState<Campos>(() => rascunhoInicial?.campos ?? { ...CAMPOS_VAZIOS, inspetor: inspetorPadrao, dataInspecao: hojeIso() });
  const [respostas, setRespostas] = useState<Record<string, RespostaItem>>(rascunhoInicial?.respostas ?? {});
  const [fotos, setFotos] = useState<string[]>([]);
  const [assinaturaTecnico, setAssinaturaTecnico] = useState<string | null>(null);
  const [assinaturaOperador, setAssinaturaOperador] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const { data: modelos, loading: carregandoLista, error: erroLista } = useFetched(carregarModelos, NENHUM_MODELO);
  const carregarItens = useCallback(async (): Promise<ChecklistItem[]> => {
    if (!modeloId) return SEM_ITENS;
    const res = await fetch(`/api/qualidade/checklists/${modeloId}`);
    if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar o checklist."));
    return (await res.json()).modelo.itens;
  }, [modeloId]);
  const { data: itens, error: erroItens } = useFetched(carregarItens, SEM_ITENS);
  const modelo = modelos.find((m) => m.id === modeloId) ?? null;
  const itensDoModelo = modelo && itens.length === modelo.totalItens ? itens : SEM_ITENS;

  useEffect(() => {
    try {
      const rascunho: Rascunho = { salvoEm: agoraBr(), clientId, modeloId, campos, respostas };
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(rascunho));
    } catch {
      // Without browser storage the form still works; only the draft is lost.
    }
  }, [clientId, modeloId, campos, respostas]);

  const chave = useCallback((numero: number) => `${modeloId}_${numero}`, [modeloId]);
  const valorDe = (numero: number): RespostaItem => respostas[chave(numero)] ?? { resposta: RESPOSTA_PADRAO, comentario: "" };

  const onResposta = useCallback(
    (numero: number, resposta: Resposta) =>
      setRespostas((atual) => ({ ...atual, [chave(numero)]: { comentario: atual[chave(numero)]?.comentario ?? "", resposta } })),
    [chave]
  );
  const onComentario = useCallback(
    (numero: number, comentario: string) =>
      setRespostas((atual) => ({ ...atual, [chave(numero)]: { resposta: atual[chave(numero)]?.resposta ?? RESPOSTA_PADRAO, comentario } })),
    [chave]
  );

  const definir = (campo: keyof Campos, valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));

  const descartarRascunho = () => {
    setCampos({ ...CAMPOS_VAZIOS, inspetor: inspetorPadrao, dataInspecao: hojeIso() });
    setRespostas({});
    setClientId(crypto.randomUUID());
    setRestauradoEm(null);
  };

  const adicionarFotos = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setErro(null);
    try {
      const novas = await Promise.all([...arquivos].map((f) => comprimirFoto(f, FOTO_MAIOR_LADO, FOTO_QUALIDADE)));
      setFotos((atuais) => [...atuais, ...novas].slice(0, CHECKLIST_FOTOS_MAX));
      if (fotos.length + novas.length > CHECKLIST_FOTOS_MAX) setErro(`Anexe no máximo ${CHECKLIST_FOTOS_MAX} fotos.`);
    } catch {
      setErro("Não foi possível ler uma das fotos. Use JPEG ou PNG.");
    }
  };

  const salvar = async () => {
    if (!modelo || !itensDoModelo.length) return setErro("Escolha o equipamento.");
    setErro(null);
    const { periodicidadeOpcao, periodicidadeOutros, ...textos } = campos;
    const dados = {
      ...textos,
      clientId,
      modeloId: modelo.id,
      modeloNome: modelo.nome,
      projectId: projeto.id,
      periodicidade: periodicidadeOpcao === "Outros" ? periodicidadeOutros : periodicidadeOpcao,
      assinaturaTecnico,
      assinaturaOperador,
      respostas: itensDoModelo.map((item, i) => ({ ...item, ...valorDe(i + 1) })),
    };
    try {
      setSalvando("Salvando inspeção…");
      const res = await fetch("/api/qualidade/checklists/inspecoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
      if (!res.ok) throw new Error(await readApiError(res, "Não foi possível salvar a inspeção."));
      const { inspecao } = await res.json();

      for (let i = 0; i < fotos.length; i++) {
        setSalvando(`Enviando foto ${i + 1} de ${fotos.length}…`);
        const envio = await fetch(`/api/qualidade/checklists/inspecoes/${inspecao.id}/fotos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: i + 1, foto: fotos[i] }),
        });
        if (!envio.ok) throw new Error(`A inspeção foi salva, mas a foto ${i + 1} não foi enviada. ${await readApiError(envio, "Tente novamente.")}`);
      }

      setSalvando("Gerando PDF…");
      const { buildChecklistPdf } = await import("@/components/documents/checklist-document");
      await downloadPdf(() => buildChecklistPdf({ ...dados, empresaCliente: projeto.clientCompanyName ?? null, fotos }));
      try {
        localStorage.removeItem(CHAVE_RASCUNHO);
      } catch {
        // nothing to clean
      }
      onSalvo("Inspeção salva e PDF gerado.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar a inspeção.");
    } finally {
      setSalvando(null);
    }
  };

  const campoTexto = (campo: keyof Campos, rotulo: string, className = "") => (
    <div className={className}>
      <label htmlFor={`ck-${campo}`} className={labelClass}>{rotulo}</label>
      <input id={`ck-${campo}`} maxLength={255} value={campos[campo]} onChange={(e) => definir(campo, e.target.value)} className={`${inputClass} border-slate-200`} />
    </div>
  );

  return (
    <div className="space-y-5">
      {restauradoEm && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px] text-emerald-800">
          <span className="inline-flex items-center gap-2"><History className="w-4 h-4" />Rascunho restaurado (salvo em {restauradoEm}).</span>
          <Button variant="ghost" size="sm" onClick={descartarRascunho}><Trash2 className="w-3.5 h-3.5" />Descartar rascunho</Button>
        </div>
      )}

      <Panel title="Equipamento" description={`Obra: ${projeto.name}${projeto.clientCompanyName ? ` · ${projeto.clientCompanyName}` : ""}`}>
        <div className="p-4 sm:p-6">
          <label htmlFor="ck-modelo" className={labelClass}>Escolha o equipamento *</label>
          <select
            id="ck-modelo"
            value={modeloId ?? ""}
            disabled={carregandoLista}
            onChange={(e) => setModeloId(e.target.value ? Number(e.target.value) : null)}
            className={`${inputClass} border-slate-200`}
          >
            <option value="">{carregandoLista ? "Carregando…" : "Selecione"}</option>
            {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {(erroLista || erroItens) && <p role="alert" className="text-[12px] text-red-700 mt-2">{erroLista || erroItens}</p>}
        </div>
      </Panel>

      <Panel title="Dados do documento">
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-6 gap-4">
          {campoTexto("numero", "Número do documento", "sm:col-span-3")}
          {campoTexto("revisao", "Revisão", "sm:col-span-3")}
          {campoTexto("contratada", "Contratada", "sm:col-span-3")}
          {campoTexto("subcontratada", "Subcontratada", "sm:col-span-3")}
          {campoTexto("local", "Local", "sm:col-span-2")}
          {campoTexto("grupo", "Grupo", "sm:col-span-2")}
          {campoTexto("frente", "Frente de serviço", "sm:col-span-2")}
          {campoTexto("objeto", "Objeto da inspeção", "sm:col-span-2")}
          {campoTexto("tag", "Identificação/TAG", "sm:col-span-2")}
          <div className="sm:col-span-2">
            <label htmlFor="ck-periodicidade" className={labelClass}>Periodicidade da inspeção</label>
            <select id="ck-periodicidade" value={campos.periodicidadeOpcao} onChange={(e) => definir("periodicidadeOpcao", e.target.value)} className={`${inputClass} border-slate-200`}>
              {PERIODICIDADES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {campos.periodicidadeOpcao === "Outros" && (
              <input aria-label="Especifique a periodicidade" placeholder="Especifique a periodicidade" maxLength={255} value={campos.periodicidadeOutros} onChange={(e) => definir("periodicidadeOutros", e.target.value)} className={`${inputClass} border-slate-200 mt-2`} />
            )}
          </div>
          {campoTexto("inspetor", "Nome do inspetor", "sm:col-span-3")}
          <div className="sm:col-span-3">
            <label htmlFor="ck-data" className={labelClass}>Data da inspeção *</label>
            <input id="ck-data" type="date" value={campos.dataInspecao} onChange={(e) => definir("dataInspecao", e.target.value)} className={`${inputClass} border-slate-200`} />
          </div>
        </div>
      </Panel>

      {itensDoModelo.length > 0 && (
        <Panel title="Itens de verificação" description={`${itensDoModelo.length} itens. Todos começam como Conforme: altere apenas o que for diferente.`}>
          <ol className="divide-y divide-slate-100">
            {itensDoModelo.map((item, i) => (
              <ItemChecklist key={i} numero={i + 1} item={item} valor={valorDe(i + 1)} onResposta={onResposta} onComentario={onComentario} />
            ))}
          </ol>
        </Panel>
      )}

      <Panel title="Fotos da inspeção" description={`Até ${CHECKLIST_FOTOS_MAX} fotos. O documento reserva espaço para pelo menos 4.`}>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fotos.map((foto, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview (data URL) */}
                <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                <button type="button" aria-label={`Remover foto ${i + 1}`} onClick={() => setFotos((l) => l.filter((_, n) => n !== i))} className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {fotos.length < CHECKLIST_FOTOS_MAX && (
              <label className="h-28 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-[12px] font-medium text-slate-500 cursor-pointer hover:bg-slate-50">
                <Camera className="w-5 h-5" />
                Adicionar fotos
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    void adicionarFotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Assinaturas">
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {campoTexto("nomeTecnico", "Nome do técnico responsável")}
            <SignaturePad label="Assinatura do técnico responsável" onChange={setAssinaturaTecnico} />
          </div>
          <div className="space-y-3">
            {campoTexto("nomeOperador", "Nome do operador presente")}
            <SignaturePad label="Assinatura do operador presente" onChange={setAssinaturaOperador} />
          </div>
        </div>
      </Panel>

      {erro && <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{erro}</div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="ghost" onClick={onCancelar} disabled={Boolean(salvando)}>Voltar</Button>
        <Button onClick={() => void salvar()} loading={Boolean(salvando)} disabled={!itensDoModelo.length}>
          {!salvando && <CheckCircle2 className="w-4 h-4" />}
          {salvando ?? "Salvar e baixar PDF"}
        </Button>
      </div>
      <p className="text-[11.5px] text-slate-500 text-center sm:text-right">O preenchimento é salvo automaticamente como rascunho neste aparelho (exceto fotos e assinaturas).</p>
    </div>
  );
}
