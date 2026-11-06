"use client";

import React, { useState } from "react";
import { FileDown } from "lucide-react";
import { Button, extractErrorMessage, notifySite } from "@/components/ui";
import type { PdfDocumentElement } from "./template";

export interface PdfJob {
  document: PdfDocumentElement;
  fileName: string;
}

/**
 * Renders the document in the browser and downloads it. The PDF engine and the document
 * are loaded on demand, so pages that only show the button stay light.
 */
export async function downloadPdf(build: () => Promise<PdfJob>) {
  const [{ pdf }, job] = await Promise.all([import("@react-pdf/renderer"), build()]);
  const blob = await pdf(job.document).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = job.fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function PdfDownloadButton({
  build,
  label = "Baixar PDF",
  appearance = "button",
  variant = "secondary",
  size = "md",
  disabled,
  className,
}: {
  build: () => Promise<PdfJob>;
  label?: string;
  appearance?: "button" | "icon";
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadPdf(build);
    } catch (e) {
      const msg = extractErrorMessage(e, "Falha ao gerar o PDF.");
      console.warn("Falha ao gerar PDF:", msg);
      setError(msg);
      notifySite(`Não foi possível gerar o PDF: ${msg}`, "danger");
    } finally {
      setBusy(false);
    }
  };

  const title = error ? `Não foi possível gerar o PDF: ${error}` : label;

  if (appearance === "icon") {
    return (
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy || disabled}
        title={title}
        aria-label={label}
        aria-busy={busy || undefined}
        className={`p-2 rounded-lg transition disabled:opacity-60 ${
          error ? "text-red-600 hover:bg-red-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        } ${className ?? ""}`}
      >
        {busy ? (
          <span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
        ) : (
          <FileDown className="w-4 h-4" strokeWidth={1.8} />
        )}
      </button>
    );
  }

  return (
    <Button variant={error ? "danger" : variant} size={size} loading={busy} disabled={disabled} onClick={() => void run()} title={title} className={className}>
      {!busy && <FileDown className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      {busy ? "Gerando PDF…" : error ? "Tentar novamente" : label}
    </Button>
  );
}
