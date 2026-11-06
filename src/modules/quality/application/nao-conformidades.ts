import { AppError } from "@/shared/errors/AppError";
import { withDatabase } from "@/shared/errors/with-database";
import { defaultMailer, type Mailer, type SendResult } from "@/shared/email/mailer";
import { recordAudit } from "@/modules/audit/server";
import { todayInSaoPaulo } from "@/modules/workspace/domain/activities";
import { MAIN_ADMIN_EMAIL, type SessionUser } from "@/modules/users/application/session";
import { validateNaoConformidade, type NaoConformidadeInput } from "../domain/non-conformities";
import { buildNcNotificationEmail, numeroNc } from "../domain/nc-notification";
import { buildNcLembreteEmail, buildNcVerificacaoEmail } from "../domain/nc-workflow-emails";
import {
  NC_CAUSA_METODOS,
  canPerformNcAction,
  ncLembreteDevido,
  normalizeNcStatus,
  progressoPlano,
  validateCancelamento,
  validateConclusaoAcao,
  validatePlanoAcao,
  validateProrrogacao,
  validateVerificacao,
  type NcCausaMetodo,
  type NcFluxoAcao,
  type PlanoAcaoInput,
} from "../domain/nc-workflow";
import {
  defaultNaoConformidadeRepository,
  type NaoConformidadeRepository,
  type NaoConformidadeRow,
} from "../infrastructure/nc-repository";

const parsePorques = (raw: string | null): string[] => {
  try {
    const value = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

const withStatus = <T extends { status: string }>(nc: T) => ({ ...nc, status: normalizeNcStatus(nc.status) });

/** List with the plan progress of each NC ("2 de 3 ações concluídas"). */
export async function listNaoConformidades(
  filter: { projectId?: number } = {},
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository
) {
  const ncs = await repo.findMany(filter);
  const acoes = await repo.listAcoes(ncs.map((nc) => nc.id));
  return ncs.map((nc) => {
    const { concluidas, total } = progressoPlano(acoes.filter((a) => a.ncId === nc.id).map((a) => ({ status: a.status as "pendente" | "concluida" })));
    return { ...withStatus(nc), porques: parsePorques(nc.porques), acoesConcluidas: concluidas, acoesTotal: total };
  });
}

export async function getNaoConformidadeDetail(id: number, repo: NaoConformidadeRepository = defaultNaoConformidadeRepository) {
  const nc = await repo.findById(id);
  if (!nc) throw AppError.notFound("Oportunidade de melhoria não encontrada.");
  const [acoes, eventos] = await Promise.all([repo.listAcoes([id]), repo.listEventos(id)]);
  return { ...withStatus(nc), porques: parsePorques(nc.porques), acoes, eventos };
}

/**
 * Registers the NC and then notifies the project manager by e-mail (photo attached).
 * The NC stays registered even when the e-mail cannot be sent; the outcome is returned in `email`.
 */
export async function createNaoConformidade(
  input: Partial<NaoConformidadeInput>,
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository,
  mailer: Mailer = defaultMailer,
  actor?: SessionUser | null
): Promise<{ naoConformidade: NaoConformidadeRow; email: SendResult }> {
  const { isValid, errors } = validateNaoConformidade(input, todayInSaoPaulo());
  if (!isValid) {
    throw new AppError(Object.values(errors).join(" "), 422, "NC_INVALIDA");
  }
  const naoConformidade = await repo.create({ ...(input as NaoConformidadeInput), criadoPor: actor?.name ?? null });
  await repo.addEvento(naoConformidade.id, "criada", `Responsável pelo tratamento: ${naoConformidade.responsavelNome}.`, actor?.name ?? null);
  const email = await mailer.send(
    buildNcNotificationEmail({ ...(input as NaoConformidadeInput), id: naoConformidade.id }, process.env.SMTP_SENDER_NAME)
  );
  return { naoConformidade, email };
}

/** Legacy direct closing (PATCH { status: "resolvida" }); the screens now use the verification step. */
export async function resolveNaoConformidade(
  id: number,
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository,
  actor?: SessionUser | null
) {
  const existing = await repo.findById(id);
  if (!existing) throw AppError.notFound("Oportunidade de melhoria não encontrada.");
  if (normalizeNcStatus(existing.status) === "encerrada") return existing;
  const updated = await repo.markResolved(id);
  if (!updated) throw AppError.internal("Não foi possível atualizar a oportunidade de melhoria.");
  await repo.addEvento(id, "encerrada", "Encerramento direto, sem verificação registrada.", actor?.name ?? null);
  return updated;
}

const invalid = (message: string) => new AppError(message, 422, "NC_FLUXO_INVALIDO");

export interface NcFluxoBody {
  acao?: NcFluxoAcao;
  plano?: Partial<PlanoAcaoInput>;
  acaoId?: number;
  evidencia?: string;
  evidenciaFotoUrl?: string | null;
  resultado?: string;
  observacao?: string;
  novoPrazo?: string;
  justificativa?: string;
  motivo?: string;
}

/**
 * Executes one step of the NC cycle. Every step is checked against the state machine,
 * validated by the domain rules and recorded in the NC history.
 */
export async function executeNcAction(
  id: number,
  body: NcFluxoBody,
  actor: SessionUser,
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository,
  mailer: Mailer = defaultMailer
) {
  return withDatabase(async () => {
    const nc = await repo.findById(id);
    if (!nc) throw AppError.notFound("Oportunidade de melhoria não encontrada.");
    const acoes = await repo.listAcoes([id]);
    const acao = body.acao;
    if (!acao) throw AppError.badRequest("Informe a ação.");

    const check = canPerformNcAction(acao, { status: nc.status, acoes: acoes.map((a) => ({ status: a.status as "pendente" | "concluida" })) }, actor.accessLevel === "admin");
    if (!check.allowed) throw new AppError(check.reason ?? "Ação não permitida.", 409, "NC_FLUXO_BLOQUEADO");

    const status = normalizeNcStatus(nc.status);
    const hoje = todayInSaoPaulo();
    const autor = actor.name;
    const numero = numeroNc(id);
    let email: SendResult | null = null;

    switch (acao) {
      case "definir_plano": {
        const plano = body.plano ?? {};
        // Concluded actions are kept as they are; only the pending ones are (re)validated and saved.
        const pendentes = (plano.acoes ?? []).filter((a) => !acoes.some((c) => c.id === a.id && c.status === "concluida"));
        const { errors } = validatePlanoAcao({ ...plano, acoes: pendentes }, nc.dataOcorrencia);
        if (!pendentes.length && acoes.some((a) => a.status === "concluida")) delete errors.acoes;
        const messages = [errors.causaMetodo, errors.porques, errors.causaRaiz, errors.acoes].filter(Boolean);
        if (messages.length) throw invalid(messages.join(" "));
        await repo.savePendingAcoes(id, pendentes);
        await repo.update(id, {
          status: "em_tratamento",
          acaoImediata: plano.acaoImediata?.trim() || null,
          causaMetodo: plano.causaMetodo as NcCausaMetodo,
          porques: JSON.stringify((plano.porques ?? []).map((p) => p.trim()).filter(Boolean)),
          causaRaiz: plano.causaRaiz!.trim(),
        });
        await repo.addEvento(
          id,
          status === "aberta" ? "plano_definido" : "plano_atualizado",
          `Método: ${NC_CAUSA_METODOS[plano.causaMetodo as NcCausaMetodo]}. ${pendentes.length} ação(ões) pendente(s) no plano.`,
          autor
        );
        break;
      }
      case "concluir_acao": {
        const alvo = acoes.find((a) => a.id === body.acaoId);
        if (!alvo) throw AppError.notFound("Ação não encontrada nesta OM.");
        if (alvo.status === "concluida") throw invalid("Esta ação já foi concluída.");
        const erro = validateConclusaoAcao(body);
        if (erro) throw invalid(erro);
        await repo.concludeAcao(alvo.id, body.evidencia!.trim(), body.evidenciaFotoUrl || null);
        await repo.addEvento(id, "acao_concluida", `"${alvo.oQue}" — evidência: ${body.evidencia!.trim()}`, autor);
        break;
      }
      case "enviar_verificacao": {
        await repo.update(id, { status: "aguardando_verificacao" });
        await repo.addEvento(id, "enviada_verificacao", "Todas as ações concluídas.", autor);
        email = await mailer.send(buildNcVerificacaoEmail(nc, process.env.NC_VERIFICACAO_EMAIL || MAIN_ADMIN_EMAIL, autor));
        break;
      }
      case "verificar": {
        const erro = validateVerificacao(body);
        if (erro) throw invalid(erro);
        const eficaz = body.resultado === "eficaz";
        const now = new Date();
        await repo.update(id, {
          status: eficaz ? "encerrada" : "em_tratamento",
          verificacaoResultado: body.resultado,
          verificacaoObs: body.observacao!.trim(),
          verificadoPor: autor,
          verificadoEm: now,
          encerradaEm: eficaz ? now : null,
          resolvidaEm: eficaz ? now : null,
        });
        await repo.addEvento(id, eficaz ? "encerrada" : "reaberta", body.observacao!.trim(), autor);
        await recordAudit({ actorId: actor.id, actorName: autor, action: "nc_verified", entity: "nc", entityId: id, details: `${numero} · ${eficaz ? "eficaz" : "ineficaz"}` });
        break;
      }
      case "prorrogar": {
        const erro = validateProrrogacao(body, nc.prazo, hoje);
        if (erro) throw invalid(erro);
        await repo.update(id, {
          prazo: body.novoPrazo,
          prazoOriginal: nc.prazoOriginal ?? nc.prazo,
          lembretePrazoEm: null,
          lembreteVencidaEm: null,
        });
        const detalhe = `${nc.prazo.split("-").reverse().join("/")} para ${body.novoPrazo!.split("-").reverse().join("/")}. ${body.justificativa!.trim()}`;
        await repo.addEvento(id, "prazo_prorrogado", detalhe, autor);
        await recordAudit({ actorId: actor.id, actorName: autor, action: "nc_deadline_extended", entity: "nc", entityId: id, details: `${numero} · ${detalhe}` });
        break;
      }
      case "cancelar": {
        const erro = validateCancelamento(body.motivo);
        if (erro) throw invalid(erro);
        await repo.update(id, { status: "cancelada", canceladaMotivo: body.motivo!.trim() });
        await repo.addEvento(id, "cancelada", body.motivo!.trim(), autor);
        await recordAudit({ actorId: actor.id, actorName: autor, action: "nc_canceled", entity: "nc", entityId: id, details: `${numero} · ${body.motivo!.trim()}` });
        break;
      }
    }

    return { naoConformidade: await getNaoConformidadeDetail(id, repo), email };
  });
}

/**
 * Daily job: e-mails the person responsible when the deadline is 2 days away (or less)
 * and when it is overdue. Each reminder is sent once per deadline.
 */
export async function sendNcReminders(
  hoje = todayInSaoPaulo(),
  repo: NaoConformidadeRepository = defaultNaoConformidadeRepository,
  mailer: Mailer = defaultMailer
): Promise<{ verificadas: number; enviados: number; falhas: number }> {
  const ncs = await repo.findMany();
  let enviados = 0;
  let falhas = 0;
  for (const nc of ncs) {
    const tipo = ncLembreteDevido(nc, hoje);
    if (!tipo) continue;
    const result = await mailer.send(buildNcLembreteEmail(nc, tipo, hoje, process.env.SMTP_SENDER_NAME));
    if (!result.sent) {
      falhas++;
      continue;
    }
    enviados++;
    await repo.update(nc.id, tipo === "vencida" ? { lembreteVencidaEm: new Date() } : { lembretePrazoEm: new Date() });
    await repo.addEvento(nc.id, "lembrete_enviado", `${tipo === "vencida" ? "Prazo vencido" : "Prazo próximo"} — e-mail para ${nc.responsavelEmail}.`, null);
  }
  return { verificadas: ncs.length, enviados, falhas };
}
