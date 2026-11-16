/** Screens whose content does not depend on the project chosen in the header. */
const TELAS_DE_TODAS_AS_OBRAS = ["/espaco-trabalho", "/admin", "/perfil", "/alterar-senha"];

export function telaUsaObraAtiva(pathname: string): boolean {
  return !TELAS_DE_TODAS_AS_OBRAS.some((tela) => pathname === tela || pathname.startsWith(`${tela}/`));
}
