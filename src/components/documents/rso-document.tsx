import React from "react";
import { Text } from "@react-pdf/renderer";
import {
  RDO_ACTIVITY_STATUS_LABELS,
  RDO_SITUATION_LABELS,
  WEATHER_LABELS,
  getRdoSituation,
  labelOf,
} from "@/modules/rdo";
import type { RsoReport } from "@/modules/rso";
import { buildDocumentCode, buildDocumentFileName, formatDocumentDate } from "@/shared/documents/document-meta";
import {
  DataTable,
  DocumentShell,
  KpiRow,
  FieldGrid,
  PhotoGrid,
  Section,
  SignatureBlock,
  Tag,
  preparePhotoUrlForPdf,
  type Tone,
} from "./template";
import type { PdfJob } from "./PdfDownloadButton";

type Row = Record<string, any>;

const SITUATION_TONE: Record<string, Tone> = { paralisado: "danger", com_ocorrencias: "warning", concluido: "success" };

/** Keeps the weekly PDF readable; the full gallery stays in the system. */
const MAX_PHOTOS = 12;

function RsoDocument({ report, project, code }: { report: RsoReport; project: Row; code: string }) {
  const { summary, period } = report;
  const rdos: Row[] = report.rdos ?? [];
  const activities: Row[] = report.activities ?? [];
  const occurrences: Row[] = report.occurrences ?? [];
  const photos: Row[] = (report.photos ?? []).slice(0, MAX_PHOTOS);
  const rdoNumberById = new Map(rdos.map((r) => [r.id, r.rdoNumber]));
  const contractors = [...new Map((report.contractors ?? []).map((c: Row) => [c.companyName, c])).values()];
  const periodLabel = `${formatDocumentDate(period.startDate)} a ${formatDocumentDate(period.endDate)}`;

  return (
    <DocumentShell
      title="Relatório Semanal de Obra"
      subtitle={`${project.name ?? "Obra"} · ${periodLabel}`}
      code={code}
      issuedOn={formatDocumentDate(period.endDate)}
    >
      <Section number={1} title="Identificação">
        <FieldGrid
          fields={[
            { label: "Obra", value: project.name ?? "—", span: 2 },
            { label: "Código da obra", value: project.code ?? "—" },
            { label: "Período", value: periodLabel },
            { label: "Contratante / empresa", value: project.companyName ?? "—", span: 2 },
            { label: "Responsável técnico", value: project.managerName ?? "—", span: 2 },
          ]}
        />
      </Section>

      <Section number={2} title="Indicadores da semana">
        <KpiRow
          items={[
            { label: "RDOs emitidos", value: summary.totalRdos },
            { label: "Dias trabalhados", value: summary.totalDaysWorked },
            { label: "Dias paralisados", value: summary.totalDaysHalted },
            { label: "Homens-hora", value: summary.totalHh },
            { label: "Efetivo médio/dia", value: summary.avgHeadcount },
            { label: "Ocorrências", value: summary.totalOccurrences },
          ]}
        />
      </Section>

      <Section number={3} title="Diários de obra do período">
        <DataTable
          columns={[
            { header: "RDO", flex: 0.8 },
            { header: "Data", flex: 1.4 },
            { header: "Clima manhã / tarde", flex: 2.6 },
            { header: "Efetivo", flex: 1, align: "right" },
            { header: "HH", flex: 1, align: "right" },
            { header: "Situação", flex: 1.8 },
          ]}
          rows={rdos.map((r) => {
            const situation = getRdoSituation(r);
            return [
              `#${r.rdoNumber}`,
              `${formatDocumentDate(r.date)} ${r.dayOfWeek ?? ""}`,
              `${labelOf(WEATHER_LABELS, r.weatherMorning)} / ${labelOf(WEATHER_LABELS, r.weatherAfternoon)}`,
              String(r.totalHeadcount ?? 0),
              String(r.totalHh ?? 0),
              <Tag key="situation" label={RDO_SITUATION_LABELS[situation]} tone={SITUATION_TONE[situation]} />,
            ];
          })}
          footer={["Total", `${summary.totalRdos} RDO(s)`, "", "", String(summary.totalHh), ""]}
          emptyText="Nenhum RDO registrado no período."
        />
      </Section>

      <Section number={4} title="Atividades executadas" aside={`${activities.length} registro(s)`}>
        <DataTable
          columns={[
            { header: "RDO", flex: 0.8 },
            { header: "Descrição", flex: 5 },
            { header: "Local", flex: 2.4 },
            { header: "Situação", flex: 1.6 },
          ]}
          rows={activities.map((a) => [
            rdoNumberById.has(a.rdoId) ? `#${rdoNumberById.get(a.rdoId)}` : "—",
            a.description ?? "—",
            a.location || "—",
            labelOf(RDO_ACTIVITY_STATUS_LABELS, a.status),
          ])}
          emptyText="Nenhuma atividade registrada no período."
        />
      </Section>

      <Section number={5} title="Frentes terceirizadas ativas">
        <DataTable
          columns={[
            { header: "Empresa", flex: 3 },
            { header: "Função / frente", flex: 3 },
          ]}
          rows={contractors.map((c) => [c.companyName ?? "—", c.trade || "—"])}
          emptyText="Sem empreiteiros registrados no período."
        />
      </Section>

      <Section number={6} title="Ocorrências da semana">
        <DataTable
          columns={[
            { header: "RDO", flex: 0.8 },
            { header: "Categoria", flex: 1.6 },
            { header: "Ocorrência", flex: 6 },
            { header: "Impacto", flex: 1, align: "right" },
          ]}
          rows={occurrences.map((o) => [
            rdoNumberById.has(o.rdoId) ? `#${rdoNumberById.get(o.rdoId)}` : "—",
            o.category || "—",
            <>
              {o.title ? <Text style={{ fontFamily: "Helvetica-Bold" }}>{o.title}</Text> : null}
              <Text>{o.description}</Text>
            </>,
            Number(o.impactedHours) > 0 ? `${o.impactedHours} h` : "—",
          ])}
          emptyText="Nenhuma ocorrência registrada no período."
        />
      </Section>

      {photos.length > 0 && (
        <Section
          number={7}
          title="Registro fotográfico"
          aside={report.photos.length > MAX_PHOTOS ? `${MAX_PHOTOS} de ${report.photos.length} fotos` : `${photos.length} foto(s)`}
        >
          <PhotoGrid
            photos={photos.map((p) => ({
              src: p.photoUrl,
              caption: p.caption || p.activityName || "Registro da obra",
              meta: [rdoNumberById.has(p.rdoId) ? `RDO #${rdoNumberById.get(p.rdoId)}` : null, p.locationText, p.timestamp]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </Section>
      )}

      <Section number={photos.length > 0 ? 8 : 7} title="Responsáveis" keepTogether>
        <SignatureBlock
          signers={[
            { role: "Responsável técnico da obra", name: project.managerName },
            { role: "Fiscalização / contratante" },
          ]}
        />
      </Section>
    </DocumentShell>
  );
}

export async function buildRsoPdf(report: RsoReport, fallbackProject?: Row | null): Promise<PdfJob> {
  const project = report.project ?? fallbackProject ?? {};
  const code = buildDocumentCode("RSO", project.code, report.period.startDate);
  const rawPhotos: Row[] = (report.photos ?? []).slice(0, MAX_PHOTOS);
  const resolvedPhotos = (
    await Promise.all(
      rawPhotos.map(async (p) => {
        const safeUrl = await preparePhotoUrlForPdf(p?.photoUrl);
        return safeUrl ? { ...p, photoUrl: safeUrl } : null;
      })
    )
  ).filter(Boolean) as Row[];

  const normalizedReport: RsoReport = {
    ...report,
    photos: resolvedPhotos,
  };

  return {
    document: <RsoDocument report={normalizedReport} project={project} code={code} />,
    fileName: buildDocumentFileName(code),
  };
}
