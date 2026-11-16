"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarView } from "@/components/workspace/CalendarView";

function CalendarioComParametros() {
  const nova = useSearchParams().get("nova");
  return <CalendarView key={nova ?? ""} abrirNovo={Boolean(nova)} />;
}

export default function CalendarioPage() {
  return (
    <Suspense>
      <CalendarioComParametros />
    </Suspense>
  );
}
