import { NextResponse } from "next/server";
import { listVisitPhotos } from "@/modules/workspace/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export const dynamic = "force-dynamic";

/** Photos of a visit, loaded only when the user opens them (lists carry just the count). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json({ photos: await listVisitPhotos(await parseIdParam(params)) });
  } catch (error) {
    return errorResponse(error, "Falha ao carregar as fotos.", "GET /api/espaco-trabalho/atividades/[id]/fotos");
  }
}
