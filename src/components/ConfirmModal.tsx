"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  requireTextConfirmation?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Excluir",
  cancelText = "Cancelar",
  requireTextConfirmation,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState("");

  if (!isOpen) return null;

  const isConfirmDisabled =
    requireTextConfirmation && typedValue.trim().toLowerCase() !== requireTextConfirmation.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" strokeWidth={2} />
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
            {description}
          </p>

          {requireTextConfirmation && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <label className="block text-[11.5px] font-semibold text-red-800 mb-1.5">
                Para confirmar, digite{" "}
                <span className="font-mono font-bold uppercase bg-white px-1.5 py-0.5 rounded">
                  {requireTextConfirmation}
                </span>{" "}
                abaixo:
              </label>
              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={requireTextConfirmation}
                className="w-full px-3 py-2 text-[13px] border border-red-200 rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-red-100 font-medium"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-8 py-4 rounded-xl text-[14.5px] font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || Boolean(isConfirmDisabled)}
            className="inline-flex items-center gap-1.5 px-8 py-4 rounded-xl text-[14.5px] font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Trash2 className="w-6 h-6" />
            <span>{isLoading ? "Excluindo..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
