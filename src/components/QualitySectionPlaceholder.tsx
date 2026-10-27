"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

type Props = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

export function QualitySectionPlaceholder({ title, description, icon: Icon }: Props) {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/qualidade"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Qualidade</span>
          </Link>
          <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
            </div>
            <span>{title}</span>
          </h1>
          <p className="text-[12.5px] text-slate-500 mt-1">{description}</p>
        </div>

        <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-300 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-900">Em desenvolvimento</h2>
          <p className="text-[12.5px] text-slate-500 mt-1 max-w-sm">
            Esta seção ainda está sendo construída e estará disponível em breve.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
