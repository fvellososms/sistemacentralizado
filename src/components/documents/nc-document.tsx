import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import {
  NC_CAUSA_METODOS,
  NC_EVENTOS,
  NC_GRAUS,
  NC_SITUACOES_FLUXO,
  NC_TIPOS,
  diasAtePrazo,
  getNcSituacaoFluxo,
  type NaoConformidadeInput,
  type NcCausaMetodo,
  type NcEventoTipo,
  type NcGrau,
  type NcSituacaoFluxo,
} from "@/modules/quality";
import { buildDocumentCode, buildDocumentFileName, formatDocumentDate, formatDocumentDateTime } from "@/shared/documents/document-meta";
import {
  COLORS,
  DataTable,
  DocumentShell,
  PhotoGrid,
  FieldGrid,
  Section,
  SignatureBlock,
  Tag,
  TextBox,
  WriteInArea,
  mutedText,
  preparePhotoUrlForPdf,
  resolveAssetUrl,
  type Tone,
} from "./template";
import type { PdfJob } from "./PdfDownloadButton";

export interface NcPdfData extends NaoConformidadeInput {
  id: number;
  status: string;
  resolvidaEm: string | null;
  createdAt?: string;
  // Treatment cycle (present when the detail is loaded)
  acaoImediata?: string | null;
  causaMetodo?: string | null;
  porques?: string[];
  causaRaiz?: string | null;
  prazoOriginal?: string | null;
  verificacaoResultado?: string | null;
  verificacaoObs?: string | null;
  verificadoPor?: string | null;
  verificadoEm?: string | null;
  encerradaEm?: string | null;
  canceladaMotivo?: string | null;
  acoes?: {
    oQue: string;
    porQue: string;
    onde?: string | null;
    quem: string;
    quando: string;
    como: string;
    quanto?: string | null;
    status: string;
    concluidaEm: string | null;
    evidencia: string | null;
    evidenciaFotoUrl: string | null;
  }[];
  eventos?: { tipo: string; descricao: string; autor: string | null; createdAt: string }[];
}

const GRAU_TONE: Record<NcGrau, Tone> = { baixa: "neutral", media: "warning", grave: "danger" };
const SITUACAO_TONE: Record<NcSituacaoFluxo, Tone> = {
  aberta: "brand",
  em_tratamento: "brand",
  vencida: "danger",
  aguardando_verificacao: "warning",
  encerrada: "success",
  cancelada: "neutral",
};

function NcDocument({
  nc,
  code,
  today,
  projectCode,
}: {
  nc: NcPdfData;
  code: string;
  today: string;
  projectCode?: string | null;
}) {
  const situacao = getNcSituacaoFluxo(nc, today);
  const finalizada = situacao === "encerrada" || situacao === "cancelada";
  const dias = diasAtePrazo(nc.prazo, today);
  const acoes = nc.acoes ?? [];
  const temPlano = Boolean(nc.causaRaiz) || acoes.length > 0;
  const fotosEvidencia = acoes.filter((a) => a.evidenciaFotoUrl);
  let n = nc.fotoUrl ? 3 : 2;
  const prazoDetalhe =
    finalizada ? "" : dias < 0 ? ` (vencida há ${-dias} dia(s))` : dias === 0 ? " (vence hoje)" : ` (faltam ${dias} dia(s))`;

  return (
    <DocumentShell
      title="Relatório de Não Conformidade"
      subtitle={`${nc.projectName ?? "Obra"} · ${nc.titulo}`}
      code={code}
      issuedOn={formatDocumentDate(nc.createdAt ?? nc.dataOcorrencia)}
    >
      <Section number={1} title="Identificação">
        <FieldGrid
          fields={[
            { label: "Obra", value: nc.projectName ?? "—", span: 2 },
            { label: "Código da obra", value: projectCode ?? "—" },
            { label: "Nº da NC", value: code },
            { label: "Tipo", value: NC_TIPOS[nc.tipo] ?? nc.tipo, span: 2 },
            { label: "Grau", value: <Tag label={NC_GRAUS[nc.grau] ?? nc.grau} tone={GRAU_TONE[nc.grau] ?? "neutral"} /> },
            { label: "Situação", value: <Tag label={NC_SITUACOES_FLUXO[situacao]} tone={SITUACAO_TONE[situacao]} /> },
            { label: "Data da ocorrência", value: formatDocumentDate(nc.dataOcorrencia) },
            { label: "Local da obra", value: nc.localObra, span: 3 },
          ]}
        />
      </Section>

      <Section number={2} title="Descrição da não conformidade">
        <View wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.4, color: COLORS.ink, marginBottom: 4 }}>{nc.titulo}</Text>
          <TextBox>{nc.descricao}</TextBox>
        </View>
        <View style={{ marginTop: 6 }}>
          <FieldGrid fields={[{ label: "Requisito violado (norma, procedimento ou cláusula)", value: nc.requisitoViolado, span: 4 }]} />
        </View>
      </Section>

      {nc.fotoUrl ? (
        <Section number={3} title="Evidência fotográfica">
          <View style={{ borderWidth: 0.6, borderColor: COLORS.border, padding: 6, alignItems: "center" }} wrap={false}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            <Image src={resolveAssetUrl(nc.fotoUrl)} style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain" }} />
            <Text style={[mutedText, { marginTop: 4 }]}>Registro da não conformidade em {formatDocumentDate(nc.dataOcorrencia)}.</Text>
          </View>
        </Section>
      ) : null}

      <Section number={++n} title="Responsável e prazo" keepTogether>
        <FieldGrid
          fields={[
            { label: "Responsável pela obra", value: nc.responsavelNome, span: 2 },
            { label: "E-mail", value: nc.responsavelEmail, span: 2 },
            {
              label: "Prazo para resolução",
              value: `${formatDocumentDate(nc.prazo)}${prazoDetalhe}${nc.prazoOriginal ? ` · prorrogado (original ${formatDocumentDate(nc.prazoOriginal)})` : ""}`,
              span: 2,
            },
            { label: "Encerrada em", value: formatDocumentDateTime(nc.encerradaEm ?? nc.resolvidaEm), span: 2 },
          ]}
        />
      </Section>

      {situacao === "cancelada" && nc.canceladaMotivo ? (
        <Section number={++n} title="Cancelamento">
          <TextBox>{nc.canceladaMotivo}</TextBox>
        </Section>
      ) : null}

      {temPlano ? (
        <>
          <Section number={++n} title="Análise de causa">
            <FieldGrid
              fields={[
                { label: "Ação imediata (contenção)", value: nc.acaoImediata || "—", span: 4 },
                { label: "Método", value: nc.causaMetodo ? NC_CAUSA_METODOS[nc.causaMetodo as NcCausaMetodo] ?? nc.causaMetodo : "—", span: 1 },
                { label: "Causa raiz", value: nc.causaRaiz || "—", span: 3 },
                ...(nc.porques?.length
                  ? [{ label: "5 Porquês", value: nc.porques.map((p, i) => `${i + 1}. ${p}`).join("\n"), span: 4 }]
                  : []),
              ]}
            />
          </Section>

          <Section number={++n} title="Plano de ação (5W2H)" aside={`${acoes.filter((a) => a.status === "concluida").length} de ${acoes.length} concluída(s)`}>
            <DataTable
              columns={[
                { header: "#", flex: 0.35, align: "center" },
                { header: "O quê / por quê", flex: 3.2 },
                { header: "Quem / onde", flex: 1.8 },
                { header: "Quando", flex: 1 },
                { header: "Como", flex: 2.6 },
                { header: "Execução", flex: 2.4 },
              ]}
              rows={acoes.map((a, i) => [
                String(i + 1),
                <>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{a.oQue}</Text>
                  <Text style={{ color: COLORS.muted }}>{a.porQue}</Text>
                </>,
                `${a.quem}${a.onde ? `\n${a.onde}` : ""}`,
                formatDocumentDate(a.quando),
                `${a.como}${a.quanto ? `\nCusto: ${a.quanto}` : ""}`,
                a.status === "concluida"
                  ? <Text key="exec">{`Concluída em ${formatDocumentDate(a.concluidaEm)}\n${a.evidencia ?? ""}`}</Text>
                  : <Tag key="exec" label="Pendente" tone="warning" />,
              ])}
              emptyText="Nenhuma ação no plano."
            />
          </Section>

          {fotosEvidencia.length > 0 && (
            <Section number={++n} title="Evidências fotográficas das ações">
              <PhotoGrid
                photos={fotosEvidencia.map((a) => ({
                  src: a.evidenciaFotoUrl!,
                  caption: a.oQue,
                  meta: `Concluída em ${formatDocumentDate(a.concluidaEm)}`,
                }))}
              />
            </Section>
          )}

          <Section number={++n} title="Verificação de eficácia" keepTogether>
            {nc.verificacaoResultado ? (
              <FieldGrid
                fields={[
                  { label: "Resultado", value: <Tag label={nc.verificacaoResultado === "eficaz" ? "Eficaz" : "Ineficaz"} tone={nc.verificacaoResultado === "eficaz" ? "success" : "danger"} /> },
                  { label: "Verificado por", value: nc.verificadoPor ?? "—" },
                  { label: "Data", value: formatDocumentDateTime(nc.verificadoEm), span: 2 },
                  { label: "O que foi verificado", value: nc.verificacaoObs ?? "—", span: 4 },
                ]}
              />
            ) : (
              <>
                <Text style={[mutedText, { marginBottom: 3 }]}>Verificação de eficácia (preenchimento pelo SMS):</Text>
                <WriteInArea lines={3} />
              </>
            )}
          </Section>
        </>
      ) : (
        <Section number={++n} title="Tratamento da não conformidade">
          <Text style={[mutedText, { marginBottom: 3 }]}>Análise de causa e ação corretiva adotada (preenchimento pelo responsável):</Text>
          <WriteInArea lines={5} />
          <Text style={[mutedText, { marginTop: 8, marginBottom: 3 }]}>Verificação de eficácia (preenchimento pelo SMS):</Text>
          <WriteInArea lines={3} />
        </Section>
      )}

      {nc.eventos?.length ? (
        <Section number={++n} title="Histórico">
          <DataTable
            columns={[
              { header: "Data", flex: 1.3 },
              { header: "Evento", flex: 2.2 },
              { header: "Detalhes", flex: 4.5 },
              { header: "Por", flex: 1.6 },
            ]}
            rows={nc.eventos.map((e) => [
              formatDocumentDateTime(e.createdAt),
              NC_EVENTOS[e.tipo as NcEventoTipo] ?? e.tipo,
              e.descricao,
              e.autor ?? "Sistema",
            ])}
          />
        </Section>
      ) : null}

      <Section number={++n} title="Responsáveis" keepTogether>
        <SignatureBlock
          signers={[
            { role: "Emitente (SMS)" },
            { role: "Responsável pela obra", name: nc.responsavelNome },
            {
              role: "Verificação de eficácia",
              name: nc.verificadoPor,
              detail: nc.verificadoEm ? `Data: ${formatDocumentDate(nc.verificadoEm)}` : undefined,
            },
          ]}
        />
      </Section>
    </DocumentShell>
  );
}

export async function buildNcPdf(nc: NcPdfData, today: string, projectCode?: string | null): Promise<PdfJob> {
  const code = buildDocumentCode("NC", projectCode, nc.id);
  const safeFotoUrl = nc.fotoUrl ? await preparePhotoUrlForPdf(nc.fotoUrl) : null;
  const normalizedNc: NcPdfData = { ...nc, fotoUrl: safeFotoUrl };
  return {
    document: <NcDocument nc={normalizedNc} code={code} today={today} projectCode={projectCode} />,
    fileName: buildDocumentFileName(code, nc.dataOcorrencia),
  };
}

/** Loads the NC with its action plan and history, then builds the PDF. */
export async function fetchNcPdf(ncId: number, today: string, projectCode?: string | null): Promise<PdfJob> {
  const res = await fetch(`/api/qualidade/nao-conformidades/${ncId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.naoConformidade) throw new Error(data.error || "Não conformidade não encontrada.");
  return buildNcPdf(data.naoConformidade, today, projectCode);
}
