import { NextResponse } from "next/server";
import { listarModelos } from "@/modules/checklists/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ modelos: (await listarModelos()).filter((m) => m.ativo) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar os checklists.", "GET /api/qualidade/checklists");
  }
}
