/**
 * Pure rules for the activities listed in an APR draft.
 */

export interface AtividadeIdentificavel {
  atividadeOrigemId: number | null;
  nome: string;
}

const normalizarNome = (nome: string) =>
  nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * An activity is already in the APR when it comes from the same knowledge-base entry,
 * or when it has the same name (ignoring case, accents and spacing), which also covers
 * manual activities typed with the name of an existing one.
 */
export function isAtividadeDuplicada(existentes: AtividadeIdentificavel[], nova: AtividadeIdentificavel): boolean {
  const nome = normalizarNome(nova.nome);
  return existentes.some(
    (a) =>
      (nova.atividadeOrigemId != null && a.atividadeOrigemId === nova.atividadeOrigemId) ||
      normalizarNome(a.nome) === nome
  );
}

/** Appends the new activities, skipping any that duplicate an existing one or each other. */
export function adicionarAtividadesSemDuplicar<T extends AtividadeIdentificavel>(existentes: T[], novas: T[]): T[] {
  const resultado = [...existentes];
  for (const nova of novas) {
    if (!isAtividadeDuplicada(resultado, nova)) resultado.push(nova);
  }
  return resultado;
}
