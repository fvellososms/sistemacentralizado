"use client";

import React, { useState } from "react";
import {
  Download,
  Trash2,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  AlertOctagon,
  Camera,
} from "lucide-react";

export interface PhotoData {
  id?: number;
  activityName: string;
  nonConformityText?: string | null;
  goodPracticeText?: string | null;
  caption?: string | null;
  photoUrl: string;
  timestamp?: string | null;
  locationText?: string | null;
  showWatermark?: boolean;
}

interface PhotoCardProps {
  photo: PhotoData;
  onDelete?: () => void;
  canDelete?: boolean;
}

export function PhotoCard({ photo, onDelete, canDelete = true }: PhotoCardProps) {
  const [showWatermark, setShowWatermark] = useState(photo.showWatermark !== false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = photo.photoUrl;
    link.download = `rdo-foto-${Date.now()}.jpg`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden">
          <img
            src={photo.photoUrl}
            alt={photo.caption || photo.activityName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onClick={() => setIsZoomed(true)}
          />

          {showWatermark && (
            <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-[10.5px] font-mono leading-tight border border-white/10 select-none pointer-events-none">
              <div className="flex items-center justify-between font-semibold text-amber-300 text-[9.5px] tracking-wider uppercase mb-0.5">
                <span>RDO · Registro Técnico</span>
                <span className="text-white">
                  {photo.timestamp?.split(" ")[1] || "—"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-200 truncate">
                <Clock className="w-3 h-3 text-cyan-300 shrink-0" />
                <span className="truncate">{photo.timestamp || "—"}</span>
              </div>
              {photo.locationText && (
                <div className="flex items-center gap-1 text-slate-300 truncate mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-300 shrink-0" />
                  <span className="truncate">{photo.locationText}</span>
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="p-2 rounded-lg bg-white/95 text-slate-900 hover:bg-white transition shadow"
              title="Visualizar"
            >
              <Eye className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/95 text-slate-900 hover:bg-white transition shadow"
              title="Baixar"
            >
              <Download className="w-6 h-6" />
            </button>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow"
                title="Excluir"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3.5 space-y-2">
          <div className="flex items-start gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" />
            <div className="text-[12.5px] font-semibold text-slate-900 line-clamp-1">
              {photo.activityName}
            </div>
          </div>

          {photo.caption && (
            <p className="text-[12px] text-slate-500 italic line-clamp-2 leading-snug">
              "{photo.caption}"
            </p>
          )}

          {(photo.goodPracticeText || photo.nonConformityText) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {photo.goodPracticeText && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[140px]">
                    {photo.goodPracticeText}
                  </span>
                </span>
              )}
              {photo.nonConformityText && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                  <AlertOctagon className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[140px]">
                    {photo.nonConformityText}
                  </span>
                </span>
              )}
            </div>
          )}

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
            <span>Carimbo técnico</span>
            <button
              type="button"
              onClick={() => setShowWatermark(!showWatermark)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition ${
                showWatermark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {showWatermark ? "Ativo" : "Oculto"}
            </button>
          </div>
        </div>
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={photo.photoUrl}
              alt="Foto"
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-3 text-center text-white bg-slate-900/70 px-4 py-2.5 rounded-xl border border-white/10 max-w-lg">
              <div className="text-[13px] font-semibold">{photo.activityName}</div>
              {photo.caption && (
                <div className="text-[12px] text-slate-300 mt-0.5">"{photo.caption}"</div>
              )}
              <div className="text-[11px] text-amber-300 font-mono mt-1.5">
                {photo.timestamp} · {photo.locationText}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
