/**
 * Formal e-mail sent to the project manager when a non-conformity (NC) is registered.
 * Pure: builds subject, plain text, HTML and the optional photo attachment.
 */

import {
  NC_GRAUS,
  NC_TIPOS,
  parseImageDataUrl,
  type NaoConformidadeInput,
  type NcGrau,
  type NcTipo,
} from "./non-conformities.ts";

export interface NcNotificationData extends NaoConformidadeInput {
  id: number;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  base64: string;
  cid: string; // referenced by the HTML body to show the photo inline
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: EmailAttachment[];
}

const EXTENSOES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const formatarData = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const numeroNc = (id: number) => `NC-${String(id).padStart(4, "0")}`;

export function buildNcNotificationEmail(nc: NcNotificationData, remetente = "Setor de Qualidade e SST"): EmailMessage {
  const numero = numeroNc(nc.id);
  const obra = nc.projectName?.trim() || `Obra nº ${nc.projectId}`;
  const foto = nc.fotoUrl ? parseImageDataUrl(nc.fotoUrl) : null;

  const campos: [string, string][] = [
    ["Número da NC", numero],
    ["Título", nc.titulo],
    ["Obra", obra],
    ["Local", nc.localObra],
    ["Tipo", NC_TIPOS[nc.tipo as NcTipo] ?? nc.tipo],
    ["Grau", NC_GRAUS[nc.grau as NcGrau] ?? nc.grau],
    ["Data da ocorrência", formatarData(nc.dataOcorrencia)],
    ["Requisito violado", nc.requisitoViolado],
    ["Prazo para tratamento", formatarData(nc.prazo)],
  ];

  const abertura =
    `Comunicamos que foi registrada uma Não Conformidade na obra ${obra}, sob sua responsabilidade, ` +
    `identificada como "${nc.titulo}". Seguem abaixo os dados do registro:`;
  const solicitacao =
    `Solicitamos que sejam adotadas as ações corretivas necessárias para o tratamento desta não conformidade ` +
    `até ${formatarData(nc.prazo)}, bem como o registro das evidências de sua resolução no sistema.`;
  const anexo = foto ? "Segue em anexo o registro fotográfico da não conformidade." : null;

  const text = [
    `Prezado(a) ${nc.responsavelNome},`,
    "",
    abertura,
    "",
    ...campos.map(([k, v]) => `${k}: ${v}`),
    "",
    "Descrição:",
    nc.descricao,
    "",
    solicitacao,
    ...(anexo ? ["", anexo] : []),
    "",
    "Atenciosamente,",
    remetente,
    "FVelloso SMS",
  ].join("\n");

  const attachments: EmailAttachment[] = foto
    ? [{ filename: `${numero}.${EXTENSOES[foto.mimeType] ?? "img"}`, contentType: foto.mimeType, base64: foto.base64, cid: `foto-${numero}` }]
    : [];

  const linhas = campos
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>` +
        `<td style="padding:6px 0;color:#0f172a;font-weight:600">${escapeHtml(v)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#0f172a">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:28px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b">Notificação de Não Conformidade · ${escapeHtml(numero)}</p>
<h1 style="margin:0 0 20px;font-size:18px">${escapeHtml(nc.titulo)}</h1>
<p>Prezado(a) ${escapeHtml(nc.responsavelNome)},</p>
<p>${escapeHtml(abertura)}</p>
<table style="border-collapse:collapse;margin:12px 0 16px">${linhas}</table>
<p style="margin:0 0 4px;color:#64748b">Descrição</p>
<p style="margin:0 0 16px;white-space:pre-line">${escapeHtml(nc.descricao)}</p>
<p>${escapeHtml(solicitacao)}</p>
${foto ? `<p>${escapeHtml(anexo!)}</p><img src="cid:${attachments[0].cid}" alt="Registro fotográfico da ${escapeHtml(numero)}" style="max-width:100%;border-radius:6px;border:1px solid #e2e8f0">` : ""}
<p style="margin-top:24px">Atenciosamente,<br>${escapeHtml(remetente)}<br>FVelloso SMS</p>
</div></body></html>`;

  return {
    to: nc.responsavelEmail.trim(),
    subject: `Notificação de Não Conformidade ${numero} – ${nc.titulo}`,
    text,
    html,
    attachments,
  };
}
