import { NextResponse } from "next/server";
import { getRdoById, updateRdo, deleteRdo } from "@/modules/rdo/server";
import { AppError } from "@/shared/errors/AppError";
import { parseIdParam } from "@/shared/http/route-params";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const rdoId = await parseIdParam(params);
    if (isNaN(rdoId)) {
      return NextResponse.json({ error: "Invalid RDO ID" }, { status: 400 });
    }

    const rdo = await getRdoById(rdoId);
    if (!rdo) {
      return NextResponse.json({ error: "RDO não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ rdo });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error fetching single RDO:", error);
    return NextResponse.json({ error: "Erro ao buscar RDO" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const rdoId = await parseIdParam(params);
    const body = await request.json();
    const updated = await updateRdo(rdoId, body);
    return NextResponse.json({ rdo: updated, message: "RDO atualizado com sucesso!" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error updating RDO:", error);
    return NextResponse.json({ error: "Erro ao atualizar RDO" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const rdoId = await parseIdParam(params);
    if (isNaN(rdoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await deleteRdo(rdoId);
    return NextResponse.json({ success: true, message: "RDO excluído com sucesso!" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error deleting RDO:", error);
    return NextResponse.json({ error: "Erro ao excluir RDO" }, { status: 500 });
  }
}
