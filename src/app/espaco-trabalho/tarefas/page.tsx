"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TaskBoardView } from "@/components/workspace/TaskBoardView";

function QuadroComParametros() {
  const nova = useSearchParams().get("nova");
  return <TaskBoardView key={nova ?? ""} abrirNova={Boolean(nova)} />;
}

export default function QuadroTarefasPage() {
  return (
    <Suspense>
      <QuadroComParametros />
    </Suspense>
  );
}
