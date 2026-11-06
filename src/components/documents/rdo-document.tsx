import React from "react";
import { Text } from "@react-pdf/renderer";
import {
  RDO_ACTIVITY_STATUS_LABELS,
  RDO_NC_SEVERITY_LABELS,
  RDO_NC_STATUS_LABELS,
  RDO_SITUATION_LABELS,
  WEATHER_LABELS,
  WORK_CONDITION_LABELS,
  getRdoSituation,
  labelOf,
} from "@/modules/rdo";
import { buildDocumentCode, buildDocumentFileName, formatDocumentDate, formatDocumentDateTime } from "@/shared/documents/document-meta";
import {
  DataTable,
  DocumentShell,
  EmptyNote,
  FieldGrid,
  PhotoGrid,
  Section,
  SignatureBlock,
  Tag,
  TextBox,
  mutedText,
  preparePhotoUrlForPdf,
  type Tone,
} from "./template";
import type { PdfJob } from "./PdfDownloadButton";

/** RDO as returned by GET /api/rdos/[id]. */
type RdoPayload = Record<string, any>;

const SITUATION_TONE: Record<string, Tone> = { paralisado: "danger", com_ocorrencias: "warning", concluido: "success" };
const SEVERITY_TONE: Record<string, Tone> = { alta: "danger", media: "warning", baixa: "neutral" };

const n = (v: unknown) => Number(v) || 0;

function RdoDocument({ rdo, fallbackProject }: { rdo: RdoPayload; fallbackProject?: RdoPayload | null }) {
  const project = rdo.project ?? fallbackProject ?? {};
  const situation = getRdoSituation(rdo);
  const code = buildDocumentCode("RDO", project.code, rdo.rdoNumber);
  const contractors: RdoPayload[] = rdo.contractors ?? [];
  const activities: RdoPayload[] = rdo.activities ?? [];
  const occurrences: RdoPayload[] = rdo.occurrences ?? [];
  const nonConformities: RdoPayload[] = rdo.nonConformities ?? [];
  const photos: RdoPayload[] = rdo.photos ?? [];

  return (
    <DocumentShell
      title="Relatório Diário de Obra"
      subtitle={`${project.name ?? "Obra"} · ${formatDocumentDate(rdo.date)} (${rdo.dayOfWeek ?? ""})`}
      code={code}
      issuedOn={formatDocumentDate(rdo.date)}
    >
      <Section number={1} title="Identificação">
        <FieldGrid
          fields={[
            { label: "Obra", value: project.name ?? "—", span: 2 },
            { label: "Código da obra", value: project.code ?? "—" },
            { label: "RDO nº", value: String(rdo.rdoNumber ?? "—") },
            { label: "Contratante / empresa", value: project.companyName ?? "—", span: 2 },
            { label: "Responsável técnico", value: project.managerName ?? "—", span: 2 },
            { label: "Endereço", value: project.address ?? "—", span: 2 },
            { label: "Data", value: `${formatDocumentDate(rdo.date)} · ${rdo.dayOfWeek ?? ""}` },
            { label: "Situação do dia", value: <Tag label={RDO_SITUATION_LABELS[situation]} tone={SITUATION_TONE[situation]} /> },
          ]}
        />
      </Section>

      <Section number={2} title="Condições climáticas e de trabalho">
        <DataTable
          columns={[
            { header: "Turno", flex: 1 },
            { header: "Clima", flex: 2 },
            { header: "Condição de trabalho", flex: 2 },
          ]}
          rows={[
            ["Manhã", labelOf(WEATHER_LABELS, rdo.weatherMorning), labelOf(WORK_CONDITION_LABELS, rdo.workConditionMorning ?? rdo.workCondition)],
            ["Tarde", labelOf(WEATHER_LABELS, rdo.weatherAfternoon), labelOf(WORK_CONDITION_LABELS, rdo.workConditionAfternoon ?? rdo.workCondition)],
          ]}
        />
      </Section>

      <Section number={3} title="Efetivo e homens-hora" aside={`${n(rdo.totalHeadcount)} trabalhadores · ${rdo.totalHh ?? "0"} HH`}>
        <DataTable
          columns={[
            { header: "Empresa", flex: 3 },
            { header: "Função / frente", flex: 3 },
            { header: "Efetivo", flex: 1, align: "right" },
          ]}
          rows={[
            [project.companyName ?? "Equipe própria", "Equipe própria", String(n(rdo.ownTeamCount))],
            ...contractors.map((c) => [c.companyName ?? "—", c.trade || "—", String(n(c.workerCount))]),
          ]}
          footer={["Total", `Homens-hora do dia: ${rdo.totalHh ?? "0"} HH`, String(n(rdo.totalHeadcount))]}
        />
      </Section>

      <Section number={4} title="Atividades executadas" aside={`${activities.length} registro(s)`}>
        <DataTable
          columns={[
            { header: "#", flex: 0.4, align: "center" },
            { header: "Descrição", flex: 5 },
            { header: "Local", flex: 2.4 },
            { header: "Situação", flex: 1.5 },
            { header: "Hora extra", flex: 1.1, align: "right" },
          ]}
          rows={activities.map((a, i) => [
            String(i + 1),
            a.description ?? "—",
            a.location || "—",
            labelOf(RDO_ACTIVITY_STATUS_LABELS, a.status),
            a.hasOvertime ? `${a.overtimeHours ?? 0} h` : "—",
          ])}
          emptyText="Nenhuma atividade registrada."
        />
      </Section>

      <Section number={5} title="Ocorrências">
        <DataTable
          columns={[
            { header: "#", flex: 0.4, align: "center" },
            { header: "Categoria", flex: 1.6 },
            { header: "Ocorrência", flex: 6 },
            { header: "Impacto", flex: 1, align: "right" },
          ]}
          rows={occurrences.map((o, i) => [
            String(i + 1),
            o.category || "—",
            <>
              {o.title ? <Text style={{ fontFamily: "Helvetica-Bold" }}>{o.title}</Text> : null}
              <Text>{o.description}</Text>
            </>,
            n(o.impactedHours) > 0 ? `${o.impactedHours} h` : "—",
          ])}
          emptyText="Nenhuma ocorrência registrada no dia."
        />
      </Section>

      <Section number={6} title="Não conformidades de SST">
        <DataTable
          columns={[
            { header: "#", flex: 0.4, align: "center" },
            { header: "Descrição", flex: 3.6 },
            { header: "NR", flex: 1 },
            { header: "Gravidade", flex: 1.3 },
            { header: "Ação corretiva", flex: 3.4 },
            { header: "Status", flex: 1.2 },
          ]}
          rows={nonConformities.map((nc, i) => [
            String(i + 1),
            nc.description ?? "—",
            nc.nr || "—",
            <Tag key="severity" label={labelOf(RDO_NC_SEVERITY_LABELS, nc.severity)} tone={SEVERITY_TONE[nc.severity] ?? "neutral"} />,
            nc.correctiveAction || "—",
            labelOf(RDO_NC_STATUS_LABELS, nc.status),
          ])}
          emptyText="Nenhuma não conformidade registrada no dia."
        />
      </Section>

      <Section number={7} title="Observações gerais">
        {rdo.observations ? <TextBox>{rdo.observations}</TextBox> : <EmptyNote>Sem observações.</EmptyNote>}
      </Section>

      {photos.length > 0 && (
        <Section number={8} title="Registro fotográfico" aside={`${photos.length} foto(s)`}>
          <PhotoGrid
            photos={photos.map((p) => ({
              src: p.photoUrl,
              caption: p.caption || p.activityName || "Registro da obra",
              meta: [p.activityName, p.locationText, p.timestamp].filter(Boolean).join(" · "),
            }))}
          />
        </Section>
      )}

      <Section number={photos.length > 0 ? 9 : 8} title="Responsáveis" keepTogether>
        <Text style={mutedText}>
          Registro elaborado por {rdo.authorName || "—"}
          {rdo.updatedAt ? `, última atualização em ${formatDocumentDateTime(rdo.updatedAt)}` : ""}.
        </Text>
        <SignatureBlock
          signers={[
            { role: "Responsável pelo preenchimento", name: rdo.authorName },
            { role: "Responsável técnico da obra", name: project.managerName },
            { role: "Fiscalização / contratante" },
          ]}
        />
      </Section>
    </DocumentShell>
  );
}

export async function buildRdoPdf(rdo: RdoPayload, fallbackProject?: RdoPayload | null): Promise<PdfJob> {
  const project = rdo.project ?? fallbackProject ?? {};
  const rawPhotos: RdoPayload[] = Array.isArray(rdo.photos) ? rdo.photos : [];
  const resolvedPhotos = (
    await Promise.all(
      rawPhotos.map(async (p) => {
        const safeUrl = await preparePhotoUrlForPdf(p?.photoUrl);
        return safeUrl ? { ...p, photoUrl: safeUrl } : null;
      })
    )
  ).filter(Boolean);

  const normalizedRdo = { ...rdo, photos: resolvedPhotos };

  return {
    document: <RdoDocument rdo={normalizedRdo} fallbackProject={fallbackProject} />,
    fileName: buildDocumentFileName(buildDocumentCode("RDO", project.code, rdo.rdoNumber), rdo.date),
  };
}

const rdoDetailClientCache = new Map<number, { rdo: RdoPayload; expiresAt: number }>();
const RDO_DETAIL_CACHE_TTL_MS = 30_000;

export function cacheRdoDetailClient(rdoId: number, rdo: RdoPayload) {
  rdoDetailClientCache.set(rdoId, {
    rdo,
    expiresAt: Date.now() + RDO_DETAIL_CACHE_TTL_MS,
  });
}

export function getCachedRdoDetailClient(rdoId: number): RdoPayload | null {
  const entry = rdoDetailClientCache.get(rdoId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    rdoDetailClientCache.delete(rdoId);
    return null;
  }
  return entry.rdo;
}

export function invalidateRdoDetailClient(rdoId?: number) {
  if (typeof rdoId === "number") {
    rdoDetailClientCache.delete(rdoId);
  } else {
    rdoDetailClientCache.clear();
  }
}

/** Loads the RDO from the API and builds the PDF (used where only the id is at hand). */
export async function fetchRdoPdf(rdoId: number, fallbackProject?: RdoPayload | null): Promise<PdfJob> {
  const cached = getCachedRdoDetailClient(rdoId);
  if (cached) {
    return buildRdoPdf(cached, fallbackProject);
  }
  const res = await fetch(`/api/rdos/${rdoId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.rdo) throw new Error(data.error || "RDO não encontrado.");
  cacheRdoDetailClient(rdoId, data.rdo);
  return buildRdoPdf(data.rdo, fallbackProject);
}
