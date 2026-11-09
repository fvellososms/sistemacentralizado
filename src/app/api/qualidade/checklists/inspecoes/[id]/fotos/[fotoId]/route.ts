import { NextResponse } from "next/server";
import { baixarFoto } from "@/modules/checklists/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; fotoId: string }> }) {
  try {
    const { id, fotoId } = await params;
    const [inspecaoId, foto] = await Promise.all([parseIdParam(Promise.resolve({ id })), parseIdParam(Promise.resolve({ id: fotoId }))]);
    const { arquivo, tipo } = await baixarFoto(inspecaoId, foto);
    return new NextResponse(arquivo, { headers: { "Content-Type": tipo, "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar a foto.", "GET /api/qualidade/checklists/inspecoes/[id]/fotos/[fotoId]");
  }
}
