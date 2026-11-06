/**
 * APR role of the logged user. The role stored in the APR users table wins (that is where an
 * "aprovador" is designated); a system administrator without a specific role manages the base as SST admin.
 */

export type PerfilApr = "colaborador" | "admin_sst" | "aprovador";
export type NivelAcessoSistema = "admin" | "usuario";

export function resolvePerfilApr(perfilCadastrado: PerfilApr | null | undefined, nivel: NivelAcessoSistema): PerfilApr {
  if (perfilCadastrado && perfilCadastrado !== "colaborador") return perfilCadastrado;
  return nivel === "admin" ? "admin_sst" : "colaborador";
}
