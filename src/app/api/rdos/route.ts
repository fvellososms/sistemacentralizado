import { NextResponse } from "next/server";
import { getRdos, createRdo } from "@/modules/rdo/server";
import { AppError } from "@/shared/errors/AppError";
import { requireSession } from "@/modules/users/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const monthParam = searchParams.get("month") || undefined;

    const projectId = projectIdParam ? parseInt(projectIdParam, 10) : undefined;
    const rdos = await getRdos({
      projectId: !isNaN(projectId as number) ? projectId : undefined,
      month: monthParam,
    });

    return NextResponse.json({ rdos });
  } catch (error) {
    console.warn("GET /api/rdos error, returning empty list:", error);
    return NextResponse.json({ rdos: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // The author is whoever is logged in, never a name sent by the form.
    const newRdo = await createRdo({ ...body, authorName: (await requireSession()).name });
    return NextResponse.json(
      { rdo: newRdo, message: "RDO registrado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error creating RDO:", error);
    return NextResponse.json({ error: "Failed to create RDO" }, { status: 500 });
  }
}
