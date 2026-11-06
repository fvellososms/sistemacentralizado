"use client";

import { PdfDownloadButton } from "@/components/documents/PdfDownloadButton";

/** Client entry point for server-rendered APR pages: loads the APR by id and downloads its PDF. */
export function AprPdfButton({
  aprId,
  codigo,
  appearance = "button",
}: {
  aprId: number;
  codigo?: string | null;
  appearance?: "button" | "icon";
}) {
  return (
    <PdfDownloadButton
      appearance={appearance}
      size="sm"
      label={codigo ? `Baixar PDF da ${codigo}` : "Baixar PDF"}
      build={async () => (await import("@/components/documents/apr-document")).fetchAprPdf(aprId)}
    />
  );
}
