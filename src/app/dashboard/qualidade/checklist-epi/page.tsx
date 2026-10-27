"use client";

import { HardHat } from "lucide-react";
import { QualitySectionPlaceholder } from "@/components/QualitySectionPlaceholder";

export default function ChecklistEpiPage() {
  return (
    <QualitySectionPlaceholder
      title="Checklist EPI"
      description="Verificação de entrega, uso e conservação de EPIs conforme NR-06."
      icon={HardHat}
    />
  );
}
