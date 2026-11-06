import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { calcularNivel, NIVEL_LABEL, NIVEL_SIMBOLO, type NivelRisco } from "@/lib/apr/risco";
import {
  PROBABILIDADE_LABEL,
  SEVERIDADE_LABEL,
  STATUS_LABEL,
  TIPO_CONTROLE_LABEL,
  TIPO_CONTROLE_ORDEM,
  type AprDraft,
  type AprStatus,
} from "@/lib/apr/types";
import { buildDocumentCode, buildDocumentFileName, formatDocumentDate, formatDocumentDateTime } from "@/shared/documents/document-meta";
import {
  DataTable,
  DocumentShell,
  EmptyNote,
  FieldGrid,
  Section,
  SignatureBlock,
  SubHeading,
  Tag,
  TextBox,
  mutedText,
  type Tone,
} from "./template";
import type { PdfJob } from "./PdfDownloadButton";

/** APR as returned by GET /api/apr/[id] (AprCompleta). */
export type AprPdfData = AprDraft & {
  obraNome?: string | null;
  obraCodigo?: string | null;
  autorNome?: string | null;
  aprovadorNome?: string | null;
  criadoEm?: string;
  submetidoEm?: string | null;
  aprovadoEm?: string | null;
};

const STATUS_TONE: Record<AprStatus, Tone> = {
  rascunho: "neutral",
  aguardando_aprovacao: "warning",
  aprovada: "success",
  reprovada: "danger",
};

const NIVEL_TONE: Record<NivelRisco, Tone> = { baixo: "success", moderado: "warning", alto: "danger", critico: "danger" };

/** Watermark for copies that are not valid for execution yet. */
const WATERMARK: Partial<Record<AprStatus, string>> = {
  rascunho: "RASCUNHO",
  aguardando_aprovacao: "NÃO APROVADA",
  reprovada: "REPROVADA",
};

const TEAM_ROWS = 8;

function AprDocument({ apr, code }: { apr: AprPdfData; code: string }) {
  const obra = apr.obraCodigo ? `${apr.obraCodigo} · ${apr.obraNome ?? ""}` : apr.obraNome ?? "—";
  const atividades = apr.atividades.map((a) => ({ ...a, riscos: a.riscos.filter((r) => r.selecionado) }));
  const totalRiscos = atividades.reduce((sum, a) => sum + a.riscos.length, 0);

  return (
    <DocumentShell
      title="Análise Preliminar de Riscos"
      subtitle={`${obra} · ${apr.localObra || "Local não informado"}`}
      code={code}
      issuedOn={formatDocumentDate(apr.aprovadoEm ?? apr.submetidoEm ?? apr.criadoEm ?? apr.dataExecucao)}
      watermark={WATERMARK[apr.status]}
    >
      <Section number={1} title="Identificação">
        <FieldGrid
          fields={[
            { label: "Obra", value: obra, span: 2 },
            { label: "Código da APR", value: apr.codigo ?? "—" },
            { label: "Situação", value: <Tag label={STATUS_LABEL[apr.status]} tone={STATUS_TONE[apr.status]} /> },
            { label: "Local / frente de serviço", value: apr.localObra || "—", span: 2 },
            { label: "Data de execução", value: formatDocumentDate(apr.dataExecucao) },
            { label: "Elaborada por", value: apr.autorNome ?? "—" },
            { label: "Responsável pela execução", value: apr.responsavel || "—", span: 2 },
            { label: "Equipe", value: apr.equipe || "—", span: 2 },
          ]}
        />
      </Section>

      <Section number={2} title="Descrição do serviço">
        <TextBox>{apr.descricaoServico || "—"}</TextBox>
      </Section>

      {apr.status === "reprovada" && apr.motivoReprovacao ? (
        <View style={{ marginTop: 8 }} wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.4, color: "#B91C1C", marginBottom: 3 }}>Motivo da reprovação</Text>
          <TextBox>{apr.motivoReprovacao}</TextBox>
        </View>
      ) : null}

      <Section number={3} title="Atividades, riscos e medidas de controle" aside={`${atividades.length} atividade(s) · ${totalRiscos} risco(s)`}>
        <Text style={[mutedText, { marginBottom: 4 }]}>
          Nível de risco pela matriz 3 × 3 (probabilidade × severidade): I Baixo · II Moderado · III Alto · IV Crítico.
        </Text>
        {atividades.length === 0 ? (
          <EmptyNote>Nenhuma atividade analisada.</EmptyNote>
        ) : (
          atividades.map((a, i) => (
            <View key={a.key}>
              <SubHeading aside={a.categoria ? <Tag label={a.categoria} /> : undefined}>
                Atividade {String(i + 1).padStart(2, "0")} · {a.nome}
              </SubHeading>
              <DataTable
                columns={[
                  { header: "Perigo / risco", flex: 2.6 },
                  { header: "NRs", flex: 1 },
                  { header: "P × S", flex: 1.4 },
                  { header: "Nível", flex: 1.3 },
                  { header: "Medidas de controle", flex: 4.4 },
                ]}
                rows={a.riscos.map((r) => {
                  const nivel = calcularNivel(r.probabilidade, r.severidade);
                  const selecionados = TIPO_CONTROLE_ORDEM.flatMap((tipo) =>
                    r.controles.filter((c) => c.selecionado && c.tipoControle === tipo)
                  );
                  const removidos = r.controles.filter((c) => c.obrigatorio && !c.selecionado);
                  return [
                    r.nome,
                    r.nrs.length ? r.nrs.join(", ") : "—",
                    `${PROBABILIDADE_LABEL[r.probabilidade]} × ${SEVERIDADE_LABEL[r.severidade]}`,
                    <Tag key="nivel" label={`${NIVEL_SIMBOLO[nivel]} ${NIVEL_LABEL[nivel]}`} tone={NIVEL_TONE[nivel]} />,
                    <>
                      {selecionados.length === 0 ? (
                        <Text style={{ color: "#B45309" }}>Sem medidas de controle definidas.</Text>
                      ) : (
                        selecionados.map((c) => (
                          <Text key={c.key}>
                            {`• ${c.nome} (${TIPO_CONTROLE_LABEL[c.tipoControle]}${c.obrigatorio ? " · obrigatória" : ""})`}
                          </Text>
                        ))
                      )}
                      {removidos.map((c) => (
                        <Text key={c.key} style={{ color: "#B45309", marginTop: 2 }}>
                          Obrigatória não aplicada: {c.nome}. Justificativa: {c.justificativa || "—"}
                        </Text>
                      ))}
                    </>,
                  ];
                })}
                emptyText="Nenhum risco selecionado para esta atividade."
              />
            </View>
          ))
        )}
      </Section>

      <Section number={4} title="Aprovação">
        <FieldGrid
          fields={[
            { label: "Elaborada em", value: formatDocumentDateTime(apr.criadoEm) },
            { label: "Enviada para aprovação", value: formatDocumentDateTime(apr.submetidoEm) },
            { label: "Aprovada por", value: apr.aprovadorNome ?? "—" },
            { label: "Aprovada em", value: formatDocumentDateTime(apr.aprovadoEm) },
          ]}
        />
        <SignatureBlock
          signers={[
            { role: "Elaborada por", name: apr.autorNome },
            { role: "Responsável pela execução", name: apr.responsavel },
            {
              role: "Aprovada por (SMS)",
              name: apr.aprovadorNome,
              detail: apr.aprovadoEm ? `Data: ${formatDocumentDate(apr.aprovadoEm)}` : undefined,
            },
          ]}
        />
      </Section>

      <Section number={5} title="Ciência da equipe executante" keepTogether>
        <Text style={[mutedText, { marginBottom: 4 }]}>
          Declaro ter participado da análise, conhecer os riscos da atividade e as medidas de controle a serem adotadas.
        </Text>
        <DataTable
          columns={[
            { header: "#", flex: 0.4, align: "center" },
            { header: "Nome", flex: 3.4 },
            { header: "Função", flex: 2.2 },
            { header: "Assinatura", flex: 3 },
          ]}
          rows={Array.from({ length: TEAM_ROWS }, (_, i) => [String(i + 1), " \n ", "", ""])}
        />
      </Section>
    </DocumentShell>
  );
}

export function buildAprPdf(apr: AprPdfData): PdfJob {
  const code = apr.codigo || buildDocumentCode("APR", apr.obraCodigo, apr.id);
  return {
    document: <AprDocument apr={apr} code={code} />,
    fileName: buildDocumentFileName(code, apr.dataExecucao),
  };
}

export async function fetchAprPdf(aprId: number): Promise<PdfJob> {
  const res = await fetch(`/api/apr/${aprId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "APR não encontrada.");
  return buildAprPdf(data as AprPdfData);
}
