import { NextResponse } from "next/server";
import { anexarFoto } from "@/modules/checklists/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await anexarFoto(await parseIdParam(params), await request.json());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Falha ao enviar a foto.", "POST /api/qualidade/checklists/inspecoes/[id]/fotos");
  }
}
