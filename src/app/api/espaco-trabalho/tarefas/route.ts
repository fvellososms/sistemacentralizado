import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/modules/workspace/server";
import { AppError } from "@/shared/errors/AppError";

export const dynamic = "force-dynamic";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  try {
    const task = await createTask(await request.json());
    return NextResponse.json({ task, message: "Tarefa criada." }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json({ error: "Falha ao criar a tarefa." }, { status: 500 });
  }
}
