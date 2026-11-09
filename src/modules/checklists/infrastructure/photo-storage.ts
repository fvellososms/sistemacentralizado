import { createClient } from "@supabase/supabase-js";

const BUCKET = "checklist-fotos";

export class StorageNaoConfigurado extends Error {}

/**
 * Inspection photos live in a private Supabase Storage bucket. The browser never talks to it: the server
 * uses the secret key, and photos are served through a route that requires the login.
 */
function cliente() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new StorageNaoConfigurado("SUPABASE_SECRET_KEY ausente.");
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

export const photoStorage = {
  async enviar(caminho: string, bytes: Buffer, tipo: string): Promise<void> {
    const storage = cliente();
    const opcoes = { contentType: tipo, upsert: true };
    let { error } = await storage.from(BUCKET).upload(caminho, bytes, opcoes);
    if (error && /bucket not found/i.test(error.message)) {
      const criado = await storage.createBucket(BUCKET, { public: false });
      if (criado.error && !/already exists/i.test(criado.error.message)) throw criado.error;
      ({ error } = await storage.from(BUCKET).upload(caminho, bytes, opcoes));
    }
    if (error) throw error;
  },

  async baixar(caminho: string): Promise<Blob | null> {
    const { data, error } = await cliente().from(BUCKET).download(caminho);
    if (error) {
      console.error("Falha ao baixar foto do checklist:", error);
      return null;
    }
    return data;
  },
};

export type PhotoStorage = typeof photoStorage;
