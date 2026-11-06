import { NextResponse } from "next/server";
import { listAuditLogs } from "@/modules/audit/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const limit = parseInt(new URL(request.url).searchParams.get("limite") ?? "200", 10);
    return NextResponse.json({ logs: await listAuditLogs(isNaN(limit) ? 200 : limit) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar a auditoria.", "GET /api/admin/auditoria");
  }
}
