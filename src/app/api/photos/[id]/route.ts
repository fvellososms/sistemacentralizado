import { NextResponse } from "next/server";
import { deletePhoto } from "@/modules/rdo/server";
import { AppError } from "@/shared/errors/AppError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const photoId = parseInt(id, 10);
    if (isNaN(photoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await deletePhoto(photoId);
    return NextResponse.json({ success: true, message: "Foto removida com sucesso!" });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Erro ao excluir foto" }, { status: 500 });
  }
}
