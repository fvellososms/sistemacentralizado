import { NextResponse } from "next/server";
import { createClientCompany, listClientCompanies } from "@/modules/clients/server";
import { requireAdmin } from "@/modules/users/server";
import { errorResponse } from "@/shared/http/route-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ companies: await listClientCompanies() });
  } catch (error) {
    return errorResponse(error, "Falha ao listar empresas.", "GET /api/admin/empresas");
  }
}

export async function POST(request: Request) {
  try {
    const company = await createClientCompany(await requireAdmin(), await request.json());
    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Falha ao cadastrar empresa.", "POST /api/admin/empresas");
  }
}
