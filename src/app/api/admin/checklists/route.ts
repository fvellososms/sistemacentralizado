import { NextResponse } from "next/server";
import { importarModelo, listarModelos } from "@/modules/checklists/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ modelos: await listarModelos() });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar os checklists.", "GET /api/admin/checklists");
  }
}

/** POST { arquivo, csv }: one CSV file per request. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    return NextResponse.json({ modelo: await importarModelo(await request.json()) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao importar o checklist.", "POST /api/admin/checklists");
  }
}
