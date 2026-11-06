export const DATABASE_UNAVAILABLE_MESSAGE =
  "Banco de dados indisponível. O projeto Supabase pode estar pausado: reative-o no painel do Supabase e tente novamente em alguns minutos.";

const CONNECTION_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
]);

const CONNECTION_ERROR_PATTERNS = [
  /tenant\/user .+ not found/i, // pooler do Supabase quando o projeto está pausado ou não existe
  /connection terminated/i,
  /connection timeout/i,
  /timeout exceeded when trying to connect/i,
];

const MAX_CAUSE_DEPTH = 5;

/**
 * Indica se o erro (ou alguma de suas causas encadeadas, como no DrizzleQueryError)
 * representa falha de conexão com o banco, e não um erro de consulta.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current; depth++) {
    if (typeof current !== "object") return false;
    const { code, message, cause } = current as { code?: unknown; message?: unknown; cause?: unknown };

    if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;
    if (typeof message === "string" && CONNECTION_ERROR_PATTERNS.some((p) => p.test(message))) {
      return true;
    }
    current = cause;
  }
  return false;
}
