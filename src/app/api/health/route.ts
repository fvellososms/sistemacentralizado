import { db } from "@/db";
import { sql } from "drizzle-orm";
import { isDatabaseUnavailableError } from "@/shared/errors/database-errors";

export const dynamic = "force-dynamic";

/**
 * Public health check for uptime monitors: 200 when the database answers, 503 otherwise
 * (e.g. Supabase paused). Returns only status and latency, never configuration details.
 */
export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "ok", latencyMs: Date.now() - started });
  } catch (error) {
    console.error("Health check: banco de dados não respondeu.", error);
    return Response.json(
      { ok: false, database: isDatabaseUnavailableError(error) ? "indisponivel" : "erro", latencyMs: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
