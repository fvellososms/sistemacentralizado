import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularIndicadoresNc,
  canPerformNcAction,
  getNcSituacaoFluxo,
  ncLembreteDevido,
  normalizeNcStatus,
  progressoPlano,
  validateAcao5w2h,
  validateCancelamento,
  validateConclusaoAcao,
  validatePlanoAcao,
  validateProrrogacao,
  validateVerificacao,
  type NcAcaoInput,
} from "./nc-workflow.ts";

const HOJE = "2026-11-05";
const OCORRENCIA = "2026-11-01";

const acao: NcAcaoInput = {
  oQue: "Instalar guarda-corpo definitivo no poço",
  porQue: "Eliminar o risco de queda de altura",
  onde: "Bloco A, 5º pavimento",
  quem: "Mestre de obras",
  quando: "2026-11-08",
  como: "Montagem de guarda-corpo metálico com rodapé",
};

describe("NC workflow rules", () => {
  it("maps legacy and unknown statuses", () => {
    assert.equal(normalizeNcStatus("resolvida"), "encerrada");
    assert.equal(normalizeNcStatus("aguardando_verificacao"), "aguardando_verificacao");
    assert.equal(normalizeNcStatus("x"), "aberta");
  });

  it("validates 5W2H actions", () => {
    assert.deepEqual(validateAcao5w2h(acao, OCORRENCIA), {});
    const e = validateAcao5w2h({ quando: "2026-10-01" }, OCORRENCIA);
    for (const f of ["oQue", "porQue", "quem", "quando", "como"]) assert.ok(f in e, `missing ${f}`);
  });

  it("validates the action plan with root cause analysis", () => {
    const ok = validatePlanoAcao(
      { causaMetodo: "cinco_porques", porques: ["Guarda-corpo removido", "Desforma sem reposição"], causaRaiz: "Procedimento de desforma não prevê reposição", acoes: [acao] },
      OCORRENCIA
    );
    assert.equal(ok.isValid, true);
    const bad = validatePlanoAcao({ causaMetodo: "cinco_porques", porques: ["só um"], causaRaiz: "curta", acoes: [{ ...acao, quem: "" }] }, OCORRENCIA);
    assert.ok(bad.errors.porques && bad.errors.causaRaiz && bad.errors.acoes);
    assert.ok(bad.errors.acoesItens?.[0]?.quem);
    assert.ok(validatePlanoAcao({ causaMetodo: "outro", causaRaiz: "Causa raiz descrita aqui", acoes: [] }, OCORRENCIA).errors.acoes);
  });

  it("validates conclusion, verification, extension and cancellation", () => {
    assert.equal(validateConclusaoAcao({ evidencia: "Guarda-corpo instalado e inspecionado" }), null);
    assert.ok(validateConclusaoAcao({ evidencia: "ok" }));
    assert.ok(validateConclusaoAcao({ evidencia: "Evidência suficiente", evidenciaFotoUrl: "data:text/plain;base64,AA" }));
    assert.equal(validateVerificacao({ resultado: "eficaz", observacao: "Inspeção em campo confirmou" }), null);
    assert.ok(validateVerificacao({ resultado: "talvez", observacao: "Inspeção em campo confirmou" }));
    assert.equal(validateProrrogacao({ novoPrazo: "2026-11-20", justificativa: "Material em falta no fornecedor" }, "2026-11-10", HOJE), null);
    assert.ok(validateProrrogacao({ novoPrazo: "2026-11-10", justificativa: "Material em falta no fornecedor" }, "2026-11-10", HOJE));
    assert.ok(validateProrrogacao({ novoPrazo: "2026-11-20", justificativa: "curta" }, "2026-11-10", HOJE));
    assert.ok(validateCancelamento("x"));
    assert.equal(validateCancelamento("Registrada em duplicidade com a NC-0003"), null);
  });

  it("controls which action is allowed in each status", () => {
    assert.equal(canPerformNcAction("definir_plano", { status: "aberta" }, false).allowed, true);
    assert.equal(canPerformNcAction("concluir_acao", { status: "aberta" }, false).allowed, false);
    assert.equal(canPerformNcAction("enviar_verificacao", { status: "em_tratamento", acoes: [{ status: "pendente" }] }, false).allowed, false);
    assert.equal(canPerformNcAction("enviar_verificacao", { status: "em_tratamento", acoes: [{ status: "concluida" }] }, false).allowed, true);
    assert.equal(canPerformNcAction("verificar", { status: "aguardando_verificacao" }, false).allowed, false);
    assert.equal(canPerformNcAction("verificar", { status: "aguardando_verificacao" }, true).allowed, true);
    assert.equal(canPerformNcAction("definir_plano", { status: "aguardando_verificacao" }, true).allowed, false);
    assert.equal(canPerformNcAction("cancelar", { status: "resolvida" }, true).allowed, false);
  });

  it("computes the situation, reminders and indicators", () => {
    assert.equal(getNcSituacaoFluxo({ status: "em_tratamento", prazo: "2026-11-04" }, HOJE), "vencida");
    assert.equal(getNcSituacaoFluxo({ status: "aguardando_verificacao", prazo: "2026-11-04" }, HOJE), "aguardando_verificacao");
    assert.equal(ncLembreteDevido({ status: "aberta", prazo: "2026-11-07" }, HOJE), "prazo_proximo");
    assert.equal(ncLembreteDevido({ status: "aberta", prazo: "2026-11-07", lembretePrazoEm: "x" }, HOJE), null);
    assert.equal(ncLembreteDevido({ status: "aberta", prazo: "2026-11-04" }, HOJE), "vencida");
    assert.equal(ncLembreteDevido({ status: "encerrada", prazo: "2026-11-04" }, HOJE), null);
    assert.equal(ncLembreteDevido({ status: "aberta", prazo: "2026-11-20" }, HOJE), null);

    const ind = calcularIndicadoresNc(
      [
        { status: "encerrada", prazo: "2026-11-05", dataOcorrencia: "2026-11-01", encerradaEm: "2026-11-03T10:00:00Z" },
        { status: "resolvida", prazo: "2026-11-02", dataOcorrencia: "2026-11-01", resolvidaEm: "2026-11-05T10:00:00Z" },
        { status: "aberta", prazo: "2026-11-01", dataOcorrencia: "2026-10-30" },
      ],
      HOJE
    );
    assert.equal(ind.total, 3);
    assert.equal(ind.porSituacao.encerrada, 2);
    assert.equal(ind.porSituacao.vencida, 1);
    assert.equal(ind.encerradasNoPrazo, 50);
    assert.equal(ind.tempoMedioEncerramentoDias, 3);
    assert.deepEqual(progressoPlano([{ status: "concluida" }, { status: "pendente" }]), { concluidas: 1, total: 2 });
  });
});
