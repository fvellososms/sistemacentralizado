import { NextResponse } from "next/server";
import { createProject, listProjectsForAdmin } from "@/modules/projects/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ projects: await listProjectsForAdmin() });
  } catch (error) {
    return errorResponse(error, "Falha ao listar obras.", "GET /api/admin/obras");
  }
}

export async function POST(request: Request) {
  try {
    const project = await createProject(await requireAdmin(), await request.json());
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao cadastrar obra.", "POST /api/admin/obras");
  }
}
