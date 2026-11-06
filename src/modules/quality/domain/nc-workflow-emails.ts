/**
 * E-mails of the NC treatment cycle (pure): deadline reminders to the person responsible
 * and the "awaiting verification" notice to the SMS administrator.
 */

import { numeroNc, type EmailMessage } from "./nc-notification.ts";
import { diasAtePrazo } from "./non-conformities.ts";
import type { NcLembrete } from "./nc-workflow.ts";

export interface NcEmailData {
  id: number;
  titulo: string;
  projectName?: string | null;
  localObra: string;
  prazo: string;
  responsavelNome: string;
  responsavelEmail: string;
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const formatarData = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

function message(to: string, subject: string, eyebrow: string, paragraphs: string[], remetente: string): EmailMessage {
  const text = [...paragraphs, "", "Atenciosamente,", remetente, "FVelloso SMS"].join("\n\n");
  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#0f172a">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:28px">
<p style="margin:0 0 16px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b">${escapeHtml(eyebrow)}</p>
${paragraphs.map((p) => `<p style="white-space:pre-line">${escapeHtml(p)}</p>`).join("\n")}
<p style="margin-top:24px">Atenciosamente,<br>${escapeHtml(remetente)}<br>FVelloso SMS</p>
</div></body></html>`;
  return { to: to.trim(), subject, text, html, attachments: [] };
}

export function buildNcLembreteEmail(nc: NcEmailData, tipo: NcLembrete, hoje: string, remetente = "Setor de Qualidade e SST"): EmailMessage {
  const numero = numeroNc(nc.id);
  const obra = nc.projectName?.trim() || "obra";
  const dias = diasAtePrazo(nc.prazo, hoje);
  const situacao =
    tipo === "vencida"
      ? `está com o prazo vencido desde ${formatarData(nc.prazo)} (há ${-dias} dia(s))`
      : dias === 0
        ? `vence hoje (${formatarData(nc.prazo)})`
        : `vence em ${dias} dia(s), em ${formatarData(nc.prazo)}`;
  return message(
    nc.responsavelEmail,
    `${tipo === "vencida" ? "Prazo vencido" : "Lembrete de prazo"}: ${numero} – ${nc.titulo}`,
    `Lembrete de Oportunidade de Melhoria · ${numero}`,
    [
      `Prezado(a) ${nc.responsavelNome},`,
      `A oportunidade de melhoria ${numero} "${nc.titulo}", registrada na ${obra} (${nc.localObra}), ${situacao}.`,
      tipo === "vencida"
        ? "Solicitamos a conclusão imediata das ações do plano e o registro das evidências no sistema. Caso precise de mais prazo, solicite a prorrogação ao setor de SMS com a devida justificativa."
        : "Solicitamos concluir as ações do plano e registrar as evidências no sistema dentro do prazo.",
    ],
    remetente
  );
}

export function buildNcVerificacaoEmail(nc: NcEmailData, adminEmail: string, enviadoPor: string): EmailMessage {
  const numero = numeroNc(nc.id);
  return message(
    adminEmail,
    `Verificação de eficácia pendente: ${numero} – ${nc.titulo}`,
    `Oportunidade de Melhoria aguardando verificação · ${numero}`,
    [
      `Todas as ações do plano da oportunidade de melhoria ${numero} "${nc.titulo}" (${nc.projectName ?? "obra"} · ${nc.localObra}) foram concluídas e enviadas para verificação por ${enviadoPor}.`,
      "Acesse o sistema para verificar a eficácia das ações e encerrar a OM, ou reabrir o tratamento se as ações não forem eficazes.",
    ],
    "Sistema FVelloso SMS"
  );
}
