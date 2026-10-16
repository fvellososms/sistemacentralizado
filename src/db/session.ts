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

export async function getUsuarioAtual(): Promise<UsuarioSessao> {
  
  const store = await cookies();
  const raw = store.get(COOKIE_USUARIO)?.value;
  const id = raw ? Number(raw) : NaN;
  let rows = Number.isFinite(id)
    ? await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1)
    : [];
  if (rows.length === 0) {
    rows = await db.select().from(usuarios).orderBy(asc(usuarios.id)).limit(1);
  }
  const u = rows[0];
  return { id: u.id, nome: u.nome, email: u.email, cargo: u.cargo, perfil: u.perfil };
}

export async function getObraAtual(): Promise<ObraSessao | null> {
  
  const store = await cookies();
  const raw = store.get(COOKIE_OBRA)?.value;
  const id = raw ? Number(raw) : NaN;
  let rows = Number.isFinite(id)
    ? await db.select().from(obras).where(eq(obras.id, id)).limit(1)
    : [];
  if (rows.length === 0) {
    rows = await db.select().from(obras).where(eq(obras.ativo, true)).orderBy(asc(obras.id)).limit(1);
  }
  if (rows.length === 0) return null;
  const o = rows[0];
  return { id: o.id, codigo: o.codigo, nome: o.nome, endereco: o.endereco };
}

export async function listarUsuarios() {
  
  return db.select().from(usuarios).orderBy(asc(usuarios.id));
}

export async function listarObras() {
  
  return db.select().from(obras).where(eq(obras.ativo, true)).orderBy(asc(obras.nome));
}

export function exigirPerfil(usuario: UsuarioSessao, ...perfis: Perfil[]) {
  return perfis.includes(usuario.perfil);
}
