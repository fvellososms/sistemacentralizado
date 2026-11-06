"use client";

import React, { useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import {
  ACTIVITY_SOURCES,
  groupQuantities,
  weeklyTrend,
  type ActivityRecord,
  type ActivitySource,
  type ActivitySummary,
} from "@/modules/workspace";
import { EmptyPanel, SOURCE_STYLE, formatNumber, formatShortDate, initials } from "./shared";

const SERIES = Object.keys(ACTIVITY_SOURCES) as ActivitySource[];

/**
 * Weekly volume per source. SVG drawn by hand, same approach as the dashboard evolution chart.
 */
export function WeeklyTrendChart({ rows }: { rows: ActivityRecord[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = weeklyTrend(rows);

  if (!data.length) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
        <TrendingUp className="w-6 h-6 mb-1.5 text-slate-300 stroke-[1.5]" />
        <span>Nenhum dado semanal registrado no período</span>
      </div>
    );
  }

  const width = 540, height = 180, paddingX = 45, paddingTop = 20, paddingBottom = 35;
  const max = Math.max(1, ...data.flatMap((d) => SERIES.map((s) => d[s])));
  const ceilMax = Math.ceil(max * 1.15);
  const getX = (i: number) => (data.length === 1 ? width / 2 : paddingX + (i / (data.length - 1)) * (width - paddingX * 2));
  const getY = (v: number) => height - paddingBottom - (v / ceilMax) * (height - paddingTop - paddingBottom);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const active = hovered !== null ? data[hovered] : null;

  return (
    <div className="relative">
      {active && (
        <div
          className="absolute z-10 pointer-events-none -top-1 bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg -translate-x-1/2"
          style={{ left: `${(getX(hovered!) / width) * 100}%` }}
        >
          <div className="font-semibold mb-0.5">Semana de {formatShortDate(active.weekStart)}</div>
          {SERIES.map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SOURCE_STYLE[s].color }} />
              {ACTIVITY_SOURCES[s]}: {formatNumber(active[s])}
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label="Volume semanal de visitas, eventos e atividades manuais"
      >
        {[0, 1, 2, 3].map((step) => {
          const val = Math.round((ceilMax / 3) * step);
          return (
            <g key={step}>
              <line x1={paddingX} y1={getY(val)} x2={width - paddingX} y2={getY(val)} stroke="#F1F5F9" strokeDasharray={step === 0 ? "0" : "3 3"} />
              <text x={paddingX - 10} y={getY(val) + 3.5} textAnchor="end" className="text-[10px] fill-slate-400 font-medium">
                {formatNumber(val)}
              </text>
            </g>
          );
        })}

        {SERIES.map((s) => (
          <polyline
            key={s}
            points={data.map((d, i) => `${getX(i).toFixed(1)},${getY(d[s]).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={SOURCE_STYLE[s].color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {data.map((d, i) => (
          <g key={d.weekStart} className="cursor-pointer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <rect x={getX(i) - 12} y={paddingTop} width="24" height={height - paddingTop - paddingBottom} fill="transparent" />
            {SERIES.map((s) => (
              <circle
                key={s}
                cx={getX(i)}
                cy={getY(d[s])}
                r={hovered === i ? 4.5 : 3}
                fill="#FFFFFF"
                stroke={SOURCE_STYLE[s].color}
                strokeWidth="2"
              />
            ))}
            {(i % labelEvery === 0 || i === data.length - 1) && (
              <text
                x={getX(i)}
                y={height - 12}
                textAnchor="middle"
                className={`text-[11px] font-medium ${hovered === i ? "fill-slate-900" : "fill-slate-500"}`}
              >
                {formatShortDate(d.weekStart)}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-5 pt-4 mt-2 border-t border-slate-100 text-[12px] text-slate-500">
        {SERIES.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: SOURCE_STYLE[s].color }} />
            <span>{ACTIVITY_SOURCES[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars with the quantity per category / company. */
export function QuantityBars({
  rows,
  field,
  limit = 6,
}: {
  rows: ActivityRecord[];
  field: "category" | "company";
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const data = groupQuantities(rows, field);
  if (!data.length) return <EmptyPanel />;
  const max = data[0].quantity;

  return (
    <div className="p-6 space-y-3">
      {data.slice(0, showAll ? data.length : limit).map((item, i) => (
        <div key={item.name} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="font-medium text-slate-700 truncate" title={item.name}>{item.name}</span>
            <span className="text-slate-800 font-semibold tabular-nums">{formatNumber(item.quantity)}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${i === 0 ? "bg-slate-900" : "bg-slate-400"}`}
              style={{ width: `${(item.quantity / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {data.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-slate-900 transition"
        >
          {showAll ? "Mostrar menos" : `Ver todas (${data.length})`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

/** Donut with the share of ESO events already submitted. */
export function SendStatusDonut({ summary }: { summary: ActivitySummary }) {
  const percent = summary.sendRate ?? 0;
  const remaining = summary.informed - summary.submitted;
  return (
    <div className="p-6 flex flex-col items-center gap-5">
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(${SOURCE_STYLE.eso.color} 0% ${percent}%, #F1F5F9 ${percent}% 100%)` }}
      >
        <div className="w-[104px] h-[104px] rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900 tracking-tight">
            {summary.sendRate === null ? "—" : `${summary.sendRate}%`}
          </span>
          <span className="text-[11px] text-slate-500">enviados</span>
        </div>
      </div>
      <div className="w-full space-y-2 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_STYLE.eso.color }} />Enviados
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatNumber(summary.submitted)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-200" />A enviar
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatNumber(remaining)}</span>
        </div>
      </div>
      <p className="w-full pt-3 border-t border-slate-100 text-[11px] text-slate-400">
        Envios registrados no ESO sobre o total informado.
      </p>
    </div>
  );
}

/** Ranking of manual deliveries per collaborator. */
export function TeamDeliveries({ rows }: { rows: ActivityRecord[] }) {
  const data = groupQuantities(rows, "collaborator").slice(0, 6);
  if (!data.length) return <EmptyPanel />;
  const tones = ["bg-slate-900 text-white", "bg-blue-50 text-blue-700", "bg-violet-50 text-violet-700"];
  return (
    <ul className="p-4 space-y-1">
      {data.map((item, i) => (
        <li key={item.name} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition">
          <span className={`w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 ${tones[i % tones.length]}`}>
            {initials(item.name)}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-medium text-slate-900 truncate">{item.name}</span>
            <span className="block text-[11px] text-slate-500">Setor técnico</span>
          </span>
          <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatNumber(item.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
