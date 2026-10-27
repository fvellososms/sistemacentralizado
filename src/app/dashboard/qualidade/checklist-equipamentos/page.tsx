"use client";

import { Wrench } from "lucide-react";
import { QualitySectionPlaceholder } from "@/components/QualitySectionPlaceholder";

export default function ChecklistEquipamentosPage() {
  return (
    <QualitySectionPlaceholder
      title="Checklist Equipamentos"
      description="Inspeção pré-uso de máquinas e equipamentos conforme NR-12 e NR-18."
      icon={Wrench}
    />
  );
}
