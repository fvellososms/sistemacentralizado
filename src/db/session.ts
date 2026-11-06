import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { obras, usuarios } from "@/db/schema";
import type { Perfil } from "@/lib/apr/types";
import { resolvePerfilApr } from "@/modules/apr/domain/perfil";
import { getSessionUser } from "@/modules/users/application/session";
import { normalizeEmail } from "@/modules/users/domain/rules";
import { AppError } from "@/shared/errors/AppError";

/** @deprecated No longer read: the APR user comes from the signed session (see getUsuarioAtual). */
export const COOKIE_USUARIO = "fv_usuario";
export const COOKIE_OBRA = "fv_obra";

export interface UsuarioSessao {
  id: number;
  nome: string;
  email: string;
  cargo: string | null;
  perfil: Perfil;
}

export interface ObraSessao {
  id: number;
  codigo: string;
  nome: string;
  endereco: string | null;
}

export const DEFAULT_USUARIO_SESSAO: UsuarioSessao = {
  id: 1,
  nome: "Alberto Martins",
  email: "fvellososms@gmail.com",
  cargo: "Encarregado Geral de Obra",
  perfil: "admin_sst",
};

export const DEFAULT_OBRA_SESSAO: ObraSessao = {
  id: 1,
  codigo: "HM-01",
  nome: "Hotel Marina",
  endereco: "Endereço Hotel Marina",
};

const SESSION_CACHE_TTL_MS = 30_000;
const usuarioCache = new Map<string, { value: UsuarioSessao; expiresAt: number }>();
const obraCache = new Map<string, { value: ObraSessao | null; expiresAt: number }>();

/**
 * APR user of the request, always derived from the signed login session (fv_sessao): the APR row is
 * found (or created) by the session e-mail. The old fv_usuario cookie is no longer trusted, since any
 * logged user could set it to act as someone else.
 */
export async function getUsuarioAtual(): Promise<UsuarioSessao> {
  const sessao = await getSessionUser();
  if (!sessao) throw AppError.unauthorized("Sessão expirada. Entre novamente.");
  const email = normalizeEmail(sessao.email);
  const cacheKey = `${sessao.id}:${email}:${sessao.accessLevel}`;
  const cached = usuarioCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.value;

  try {
    let [u] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    if (!u) {
      [u] = await db
        .insert(usuarios)
        .values({ nome: sessao.name, email, senhaHash: null, cargo: null, perfil: resolvePerfilApr(null, sessao.accessLevel) })
        .onConflictDoNothing()
        .returning();
      u ??= (await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1))[0];
    }
    if (!u) throw new Error("Usuário da APR não encontrado após o cadastro.");
    const result: UsuarioSessao = {
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo,
      perfil: resolvePerfilApr(u.perfil, sessao.accessLevel),
    };
    usuarioCache.set(cacheKey, { value: result, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
    return result;
  } catch (error) {
    // Without the database nothing is saved anyway; the fallback never carries extra permissions.
    console.warn("getUsuarioAtual: banco indisponível, usando apenas a sessão.", error);
    return { id: 0, nome: sessao.name, email, cargo: null, perfil: "colaborador" };
  }
}

export async function getObraAtual(): Promise<ObraSessao | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_OBRA)?.value;
    const cacheKey = raw ?? "__default__";
    const cached = obraCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    const id = raw ? Number(raw) : NaN;
    let rows = Number.isFinite(id)
      ? await db.select().from(obras).where(eq(obras.id, id)).limit(1)
      : [];

    if (rows.length === 0) {
      rows = await db.select().from(obras).where(eq(obras.ativo, true)).orderBy(asc(obras.id)).limit(1);
    }

    if (rows.length === 0) {
      try {
        const [inserted] = await db
          .insert(obras)
          .values({
            codigo: DEFAULT_OBRA_SESSAO.codigo,
            nome: DEFAULT_OBRA_SESSAO.nome,
            endereco: DEFAULT_OBRA_SESSAO.endereco,
            ativo: true,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted) {
          const result = {
            id: inserted.id,
            codigo: inserted.codigo,
            nome: inserted.nome,
            endereco: inserted.endereco,
          };
          obraCache.set(cacheKey, { value: result, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
          return result;
        }
      } catch {
        // Fallback em caso de indisponibilidade
      }
      return DEFAULT_OBRA_SESSAO;
    }

    const o = rows[0];
    const result = { id: o.id, codigo: o.codigo, nome: o.nome, endereco: o.endereco };
    obraCache.set(cacheKey, { value: result, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
    return result;
  } catch (error) {
    console.warn("getObraAtual: banco indisponível, retornando fallback.", error);
    return DEFAULT_OBRA_SESSAO;
  }
}

export async function listarUsuarios(): Promise<UsuarioSessao[]> {
  try {
    const rows = await db.select().from(usuarios).orderBy(asc(usuarios.id));
    if (rows.length === 0) {
      return [DEFAULT_USUARIO_SESSAO];
    }
    return rows.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo,
      perfil: u.perfil,
    }));
  } catch {
    return [DEFAULT_USUARIO_SESSAO];
  }
}

export async function listarObras(): Promise<ObraSessao[]> {
  try {
    const rows = await db.select().from(obras).where(eq(obras.ativo, true)).orderBy(asc(obras.nome));
    if (rows.length === 0) {
      return [DEFAULT_OBRA_SESSAO];
    }
    return rows.map((o) => ({
      id: o.id,
      codigo: o.codigo,
      nome: o.nome,
      endereco: o.endereco,
    }));
  } catch {
    return [DEFAULT_OBRA_SESSAO];
  }
}

export function exigirPerfil(usuario: UsuarioSessao, ...perfis: Perfil[]) {
  return perfis.includes(usuario.perfil);
}
