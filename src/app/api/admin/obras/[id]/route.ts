import { NextResponse } from "next/server";
import { updateProject } from "@/modules/projects/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";
import { parseIdParam } from "@/shared/http/route-params";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const project = await updateProject(await requireAdmin(), await parseIdParam(params), await request.json());
    return NextResponse.json({ project });
  } catch (error) {
    return errorResponse(error, "Falha ao atualizar obra.", "PATCH /api/admin/obras/[id]");
  }
}
