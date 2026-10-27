"use client";

import { CalendarClock } from "lucide-react";
import { QualitySectionPlaceholder } from "@/components/QualitySectionPlaceholder";

export default function InspecoesPage() {
  return (
    <QualitySectionPlaceholder
      title="Inspeções programadas"
      description="Agenda de inspeções periódicas, prazos e pendências do canteiro."
      icon={CalendarClock}
    />
  );
}
