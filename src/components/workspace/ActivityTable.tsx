"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Pencil, Search, Trash2, X } from "lucide-react";
import { filterActivities, type Activity } from "@/modules/workspace";
import { Avatar, EmptyPanel, Panel, SourceBadge, StatusBadge, formatNumber, formatShortDate } from "./shared";

const PAGE_SIZE = 8;

export function ActivityTable({
  rows,
  title,
  onEdit,
  onDelete,
}: {
  rows: Activity[];
  title: string;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}) {
  const [query, setQuery] = useState("");
  const [photosOf, setPhotosOf] = useState<Activity | null>(null);
  const [requestedPage, setPage] = useState(0);
  const filtered = useMemo(() => filterActivities(rows, { search: query }), [rows, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages - 1); // stays valid when filters shrink the list

  return (
    <Panel
      title={title}
      description={`${formatNumber(filtered.length)} registros encontrados`}
      action={
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar atividade…"
            aria-label="Buscar atividade"
            className="w-full pl-9 pr-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition placeholder:text-slate-400"
          />
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyPanel />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="py-3 px-6 font-medium text-[11px] uppercase tracking-wider">Atividade / empresa</th>
                  <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Colaborador</th>
                  <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Data</th>
                  <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Origem</th>
                  <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Qtd.</th>
                  <th className="py-3 px-3 font-medium text-[11px] uppercase tracking-wider">Situação</th>
                  <th className="py-3 px-6 font-medium text-[11px] uppercase tracking-wider text-right">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition align-top">
                    <td className="py-3.5 px-6 min-w-[200px]">
                      <div className="font-medium text-slate-900">{r.eventCode || r.category}</div>
                      <div className="text-[12px] text-slate-500">
                        {r.company}
                        {r.projectName ? ` · ${r.projectName}` : ""}
                      </div>
                      {r.objective && <div className="text-[12px] text-slate-600 mt-0.5">{r.objective}</div>}
                      {r.notes && (
                        <details className="mt-1 text-[12px]">
                          <summary className="cursor-pointer text-slate-500 hover:text-slate-800">{r.source === "visita" ? "Resultado" : "Observação"}</summary>
                          <p className="mt-1 text-slate-600 whitespace-pre-line">{r.notes}</p>
                        </details>
                      )}
                      {r.photoCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setPhotosOf(r)}
                          className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {r.photoCount} foto(s)
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="flex items-center gap-2 text-slate-700 whitespace-nowrap">
                        <Avatar name={r.collaborator} />
                        {r.collaborator}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{formatShortDate(r.occurredOn)}</div>
                      <div className="text-[11px] text-slate-400">{r.occurredOn.slice(0, 4)}</div>
                    </td>
                    <td className="py-3.5 px-3"><SourceBadge source={r.source} /></td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 tabular-nums">{formatNumber(r.quantity)}</div>
                      {r.source === "eso" && (
                        <div className="text-[11px] text-slate-500">{formatNumber(r.submittedQuantity)} enviados</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3.5 px-6 text-right">
                      {r.source !== "eso" ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            title="Editar atividade"
                            aria-label={`Editar ${r.category} em ${r.company}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(r)}
                            title="Excluir atividade"
                            aria-label={`Excluir ${r.category} em ${r.company}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300" title="Atualizado pela importação do ESO">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
            <span>
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                aria-label="Página anterior"
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="tabular-nums">{page + 1} / {pages}</span>
              <button
                type="button"
                disabled={page + 1 >= pages}
                onClick={() => setPage(page + 1)}
                aria-label="Próxima página"
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
      {photosOf && <VisitPhotosViewer visit={photosOf} onClose={() => setPhotosOf(null)} />}
    </Panel>
  );
}

/** Loads the photos of a visit on demand (the list only knows how many there are). */
function VisitPhotosViewer({ visit, onClose }: { visit: Activity; onClose: () => void }) {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/espaco-trabalho/atividades/${visit.id}/fotos`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Não foi possível carregar as fotos.");
        if (active) setPhotos((data.photos ?? []).map((p: { photoUrl: string }) => p.photoUrl));
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar as fotos.");
      });
    return () => {
      active = false;
    };
  }, [visit.id]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Fotos da visita">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[14px] font-semibold text-slate-900">{visit.category} · {visit.company}</div>
            <div className="text-[12px] text-slate-500">{formatShortDate(visit.occurredOn)} · {visit.collaborator}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        {error ? (
          <p className="text-[13px] text-red-700">{error}</p>
        ) : !photos ? (
          <p className="text-[13px] text-slate-500">Carregando fotos…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- data URL photo
              <img key={i} src={src} alt={`Foto ${i + 1} da visita`} className="w-full rounded-xl border border-slate-200" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
