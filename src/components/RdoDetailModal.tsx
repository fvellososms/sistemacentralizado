"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Edit3,
  CloudSun,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldAlert,
  Camera,
} from "lucide-react";
import { PhotoCard, PhotoData } from "./PhotoCard";
import { ConfirmModal } from "./ConfirmModal";

interface RdoDetailModalProps {
  rdoId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (rdo: any) => void;
  onRefresh?: () => void;
}

export function RdoDetailModal({
  rdoId,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}: RdoDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<PhotoData | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  React.useEffect(() => {
    if (isOpen && rdoId) {
      setLoading(true);
      fetch(`/api/rdos/${rdoId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.rdo) setData(json.rdo);
        })
        .catch((err) => console.error("Error loading RDO:", err))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, rdoId]);

  if (!isOpen) return null;

  const handleDeletePhotoConfirm = async () => {
    if (!photoToDelete?.id) return;
    setIsDeletingPhoto(true);
    try {
      const res = await fetch(`/api/photos/${photoToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          photos: prev.photos.filter((p: any) => p.id !== photoToDelete.id),
        }));
        setPhotoToDelete(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handlePrint = () => window.print();

  const getWeatherLabel = (val?: string) => {
    switch (val) {
      case "sol":
        return "Ensolarado";
      case "parcialmente_nublado":
        return "Parcialmente nublado";
      case "nublado":
        return "Nublado";
      case "chuva":
        return "Chuva";
      default:
        return val || "—";
    }
  };

  const getStatusBadge = () => {
    if (data?.dayStatus === "paralisado_chuva") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-100">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Paralisado (chuva)
        </span>
      );
    }
    if (data?.hasOccurrences) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Com ocorrências
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Concluído
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                RDO #{data?.rdoNumber || "—"}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[12px] text-slate-700 capitalize font-medium">
                {data?.dayOfWeek}, {data?.date?.split("-").reverse().join("/")}
              </span>
              {getStatusBadge()}
            </div>
            <h2 className="text-[16px] md:text-[17px] font-semibold text-slate-900 mt-1 truncate">
              {data?.project?.name || "—"}
            </h2>
          </div>

          <div className="flex items-center gap-1 ml-3">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Imprimir"
            >
              <Printer className="w-6 h-6" strokeWidth={1.8} />
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(data);
                  onClose();
                }}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Editar"
              >
                <Edit3 className="w-6 h-6" strokeWidth={1.8} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Fechar"
            >
              <X className="w-6 h-6" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-slate-400 text-[13px]">
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
            Carregando...
          </div>
        ) : !data ? (
          <div className="flex-1 p-12 text-center text-slate-500">Nenhum dado encontrado.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-5">
            {/* Quick Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Condições
                </span>
                <div className="text-[13px] font-semibold text-slate-900 mt-1 capitalize">
                  {data.workCondition === "praticavel" ? "Praticável" : "Impraticável"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Manhã
                </span>
                <div className="text-[13px] font-semibold text-slate-900 mt-1">
                  {getWeatherLabel(data.weatherMorning)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Tarde
                </span>
                <div className="text-[13px] font-semibold text-slate-900 mt-1">
                  {getWeatherLabel(data.weatherAfternoon)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  HH Total
                </span>
                <div className="text-[13px] font-semibold text-slate-900 mt-1">
                  {data.totalHh} <span className="text-slate-400">·</span> {data.totalHeadcount} op
                </div>
              </div>
            </div>

            {/* Efetivo Detalhado */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Efetivo detalhado
                </h3>
                <span className="text-[11px] font-medium text-slate-500">
                  {data.totalHeadcount} trabalhadores
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-[12.5px] font-semibold text-slate-900">
                      {data?.project?.companyName || "Construtora Aliança S/A"} — Equipe Própria
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Encarregados, mestres e operacionais diretos
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold text-slate-900 px-3 py-1 bg-white rounded-lg border border-slate-200">
                    {data.ownTeamCount} op
                  </div>
                </div>

                {data.contractors?.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-900">
                        {c.companyName}
                      </div>
                      <div className="text-[11px] text-slate-500">{c.trade}</div>
                    </div>
                    <div className="text-[13px] font-semibold text-slate-900 px-3 py-1 bg-white rounded-lg border border-slate-200">
                      {c.workerCount} op
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Atividades */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Atividades realizadas
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {data.activities?.map((act: any, idx: number) => (
                  <div
                    key={act.id || idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-slate-900 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{act.description}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 ml-6">
                        📍 {act.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-6 sm:ml-0">
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                          act.status === "concluido"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {act.status === "concluido" ? "Concluído" : "Andamento"}
                      </span>
                      {act.hasOvertime && (
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          +{act.overtimeHours}h extra
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Ocorrências & Não Conformidades */}
            {(data.occurrences?.length > 0 || data.nonConformities?.length > 0) && (
              <section className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-amber-100">
                  <h3 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Ocorrências e não conformidades
                  </h3>
                </div>
                <div className="p-4 space-y-2.5">
                  {data.occurrences?.map((occ: any, i: number) => (
                    <div
                      key={occ.id || i}
                      className="p-3 rounded-xl bg-amber-50/60 border border-amber-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-amber-800 uppercase tracking-wider">
                          #{i + 1} {occ.category}
                        </span>
                        {parseFloat(occ.impactedHours) > 0 && (
                          <span className="text-[10.5px] font-semibold text-amber-700">
                            Impacto: {occ.impactedHours}h
                          </span>
                        )}
                      </div>
                      <h4 className="text-[12.5px] font-semibold text-slate-900 mt-1">
                        {occ.title}
                      </h4>
                      <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">
                        {occ.description}
                      </p>
                    </div>
                  ))}

                  {data.nonConformities?.map((nc: any, i: number) => (
                    <div key={nc.id || i} className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10.5px] font-semibold text-rose-800 uppercase tracking-wider">
                          Não conformidade · {nc.severity}
                        </div>
                        {nc.nr && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 border border-rose-300/70">
                            {nc.nr}
                          </span>
                        )}
                      </div>
                      <div className="text-[12.5px] font-semibold text-slate-900 mt-1">
                        {nc.description}
                      </div>
                      {nc.correctiveAction && (
                        <div className="text-[12px] text-slate-700 mt-1">
                          <span className="font-semibold text-emerald-700">Ação: </span>
                          {nc.correctiveAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Observações */}
            {data.observations && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Observações
                </span>
                <p className="text-[12.5px] text-slate-800 mt-1.5 leading-relaxed">
                  {data.observations}
                </p>
              </div>
            )}

            {/* Photos */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Registro fotográfico
                </h3>
                <span className="text-[11px] font-medium text-slate-500">
                  {data.photos?.length || 0} fotos
                </span>
              </div>
              <div className="p-4">
                {data.photos?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {data.photos.map((photo: any) => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onDelete={() => setPhotoToDelete(photo)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-[12px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhuma foto anexada.
                  </div>
                )}
              </div>
            </section>

            <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span>Por: <strong className="text-slate-600">{data.authorName}</strong></span>
              <span>Atualizado: {new Date(data.updatedAt).toLocaleString("pt-BR")}</span>
            </div>
          </div>
        )}

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-xl text-[14.5px] font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Fechar
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onEdit(data);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm"
            >
              <Edit3 className="w-6 h-6" />
              <span>Editar RDO</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(photoToDelete)}
        title="Excluir foto"
        description="A imagem e seus metadados serão removidos permanentemente do registro."
        confirmText="Excluir foto"
        onConfirm={handleDeletePhotoConfirm}
        onCancel={() => setPhotoToDelete(null)}
        isLoading={isDeletingPhoto}
      />
    </div>
  );
}
