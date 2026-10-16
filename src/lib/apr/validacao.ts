import type { AprDraft } from "./types";

export type Erros = Record<string, string>;

/** Valida o rascunho até a etapa informada. Usado no cliente e no servidor. */
export function validarDraft(d: AprDraft, ateEtapa: number): Erros {
  const e: Erros = {};
  if (ateEtapa >= 1) {
    if (!d.localObra?.trim()) e.localObra = "Informe o local ou frente de serviço.";
    if (!d.responsavel?.trim()) e.responsavel = "Informe o responsável pela execução.";
    if (!d.dataExecucao) e.dataExecucao = "Informe a data prevista de execução.";
    if (!d.descricaoServico?.trim()) e.descricaoServico = "Descreva a atividade a ser executada.";
    else if (d.descricaoServico.trim().length < 10) e.descricaoServico = "Descreva com um pouco mais de detalhe (mínimo 10 caracteres).";
  }
  if (ateEtapa >= 2) {
    if (d.atividades.length === 0) e.atividades = "Selecione ou adicione ao menos uma atividade.";
    for (const a of d.atividades) {
      const pend = a.riscos.filter((r) => !r.revisado);
      if (pend.length) e[`riscos_${a.key}`] = `${pend.length} risco(s) aguardando sua avaliação.`;
      if (a.riscos.filter((r) => r.selecionado).length === 0) e[`riscos_vazio_${a.key}`] = "Inclua ao menos um risco aplicável para esta atividade.";
    }
  }
  if (ateEtapa >= 3) {
    for (const a of d.atividades) {
      for (const r of a.riscos.filter((x) => x.selecionado)) {
        const semControle = r.controles.filter((c) => c.selecionado).length === 0;
        if (semControle) e[`controles_${r.key}`] = "Defina ao menos uma medida de controle para este risco.";
        const obrigRemovido = r.controles.find((c) => c.obrigatorio && !c.selecionado && !c.justificativa?.trim());
        if (obrigRemovido) e[`justificativa_${obrigRemovido.key}`] = "Justifique a remoção desta medida obrigatória.";
      }
    }
  }
  return e;
}
