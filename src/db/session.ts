import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { obras, usuarios } from "@/db/schema";
import type { Perfil } from "@/lib/apr/types";

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

export async function getUsuarioAtual(): Promise<UsuarioSessao> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_USUARIO)?.value;
    const id = raw ? Number(raw) : NaN;
    let rows = Number.isFinite(id)
      ? await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1)
      : [];

    if (rows.length === 0) {
      rows = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.email, DEFAULT_USUARIO_SESSAO.email))
        .limit(1);
    }

    if (rows.length === 0) {
      rows = await db.select().from(usuarios).orderBy(asc(usuarios.id)).limit(1);
    }

    if (rows.length === 0) {
      try {
        const [inserted] = await db
          .insert(usuarios)
          .values({
            nome: DEFAULT_USUARIO_SESSAO.nome,
            email: DEFAULT_USUARIO_SESSAO.email,
            senhaHash: "senha12345678",
            cargo: DEFAULT_USUARIO_SESSAO.cargo,
            perfil: DEFAULT_USUARIO_SESSAO.perfil,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted) {
          return {
            id: inserted.id,
            nome: inserted.nome,
            email: inserted.email,
            cargo: inserted.cargo,
            perfil: inserted.perfil,
          };
        }
      } catch {
        // Fallback em caso de indisponibilidade
      }
      return DEFAULT_USUARIO_SESSAO;
    }

    const u = rows[0];
    return { id: u.id, nome: u.nome, email: u.email, cargo: u.cargo, perfil: u.perfil };
  } catch (error) {
    console.warn("getUsuarioAtual: banco indisponível, retornando fallback.", error);
    return DEFAULT_USUARIO_SESSAO;
  }
}

export async function getObraAtual(): Promise<ObraSessao | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_OBRA)?.value;
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
          return {
            id: inserted.id,
            codigo: inserted.codigo,
            nome: inserted.nome,
            endereco: inserted.endereco,
          };
        }
      } catch {
        // Fallback em caso de indisponibilidade
      }
      return DEFAULT_OBRA_SESSAO;
    }

    const o = rows[0];
    return { id: o.id, codigo: o.codigo, nome: o.nome, endereco: o.endereco };
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
