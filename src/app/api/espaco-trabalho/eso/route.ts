import { NextResponse } from "next/server";
import { importEsoCsv } from "@/modules/workspace/server";
import { AppError } from "@/shared/errors/AppError";

/** POST { csv: string } imports the ESO export (see ESO_CSV_TEMPLATE). */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { csv?: unknown };
    const count = await importEsoCsv(body.csv);
    return NextResponse.json({ count, message: `${count} registros ESO importados.` });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("Erro ao importar CSV do ESO:", error);
    return NextResponse.json({ error: "Falha ao importar o CSV do ESO." }, { status: 500 });
  }
}
