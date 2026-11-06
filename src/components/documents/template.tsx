/**
 * Shared template for every generated PDF (RDO, RSO, APR, NC): company header with logo,
 * document control box, numbered sections, form-like field grids, tables, photos and signatures.
 * Rendered with @react-pdf/renderer; only imported lazily by `downloadPdf`.
 */

import React, { type ReactNode } from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View, type DocumentProps } from "@react-pdf/renderer";
import logo from "@/assets/images/logofvelloso-documento.png";
import { formatDocumentDateTime } from "@/shared/documents/document-meta";

// Portuguese words must not be split with the default (English) hyphenation.
Font.registerHyphenationCallback((word) => [word]);

export const COLORS = {
  brand: "#1471B8",
  brandDark: "#0E4F82",
  brandSoft: "#EAF3FB",
  ink: "#0F172A",
  text: "#1F2937",
  muted: "#64748B",
  border: "#CBD5E1",
  soft: "#F1F5F9",
  white: "#FFFFFF",
};

export const COMPANY = {
  name: "FVelloso",
  tagline: "Consultoria em SMS",
  system: "FVelloso SMS",
};

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: "#F1F5F9", fg: "#334155", border: "#CBD5E1" },
  brand: { bg: "#EAF3FB", fg: "#0E4F82", border: "#A9CDEB" },
  success: { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
  danger: { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA" },
};

const PAGE_X = 36;

// Note: never set lineHeight on the Page; react-pdf then drops fixed elements with dynamic text (header/footer).
const s = StyleSheet.create({
  page: {
    paddingTop: 104,
    paddingBottom: 58,
    paddingHorizontal: PAGE_X,
    fontFamily: "Helvetica",
    fontSize: 8.8,
    color: COLORS.text,
  },
  header: { position: "absolute", top: 24, left: PAGE_X, right: PAGE_X },
  headerRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 52, height: 56, objectFit: "contain" },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  eyebrow: { fontSize: 6.6, color: COLORS.brand, letterSpacing: 1.4, textTransform: "uppercase" },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 13, color: COLORS.ink, textTransform: "uppercase", marginTop: 3 },
  docSubtitle: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  control: { width: 158, borderWidth: 0.8, borderColor: COLORS.border, borderRadius: 3 },
  controlRow: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: COLORS.border },
  controlRowLast: { flexDirection: "row" },
  controlLabel: {
    width: 56,
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    backgroundColor: COLORS.soft,
    fontSize: 6.6,
    color: COLORS.muted,
    textTransform: "uppercase",
  },
  controlValue: { flex: 1, paddingVertical: 3.5, paddingHorizontal: 5, fontFamily: "Helvetica-Bold", fontSize: 7.6, color: COLORS.ink },
  headerRule: { marginTop: 9, height: 2.4, backgroundColor: COLORS.brand },
  headerRuleThin: { marginTop: 1.2, height: 0.6, backgroundColor: COLORS.border },
  footer: {
    position: "absolute",
    bottom: 22,
    left: PAGE_X,
    right: PAGE_X,
    borderTopWidth: 0.6,
    borderTopColor: COLORS.border,
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.8,
    color: COLORS.muted,
  },
  watermark: {
    position: "absolute",
    top: 360,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 64,
    color: "#B91C1C",
    opacity: 0.07,
    transform: "rotate(-32deg)",
  },
  section: { marginTop: 12 },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.brandSoft,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brand,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
    marginBottom: 6,
  },
  sectionText: { fontFamily: "Helvetica-Bold", fontSize: 8.8, color: COLORS.brandDark, textTransform: "uppercase", letterSpacing: 0.4 },
  sectionAside: { marginLeft: "auto", fontSize: 7.4, color: COLORS.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 0.6, borderLeftWidth: 0.6, borderColor: COLORS.border },
  cell: { borderRightWidth: 0.6, borderBottomWidth: 0.6, borderColor: COLORS.border, paddingVertical: 4, paddingHorizontal: 6 },
  cellLabel: { fontSize: 6.4, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 1.5 },
  cellValue: { fontSize: 8.8, color: COLORS.ink, lineHeight: 1.3 },
  table: { borderWidth: 0.6, borderColor: COLORS.border },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: COLORS.border },
  trLast: { flexDirection: "row" },
  th: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  td: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 8.2, lineHeight: 1.3 },
  empty: {
    borderWidth: 0.6,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    paddingVertical: 8,
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 8,
  },
  textBox: { borderWidth: 0.6, borderColor: COLORS.border, padding: 7, fontSize: 8.8, lineHeight: 1.4 },
  tag: { alignSelf: "flex-start", borderWidth: 0.6, borderRadius: 7, paddingVertical: 1.5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 7 },
  kpis: { flexDirection: "row", gap: 6 },
  kpi: { flex: 1, borderWidth: 0.6, borderColor: COLORS.border, borderTopWidth: 2.2, borderTopColor: COLORS.brand, padding: 7 },
  kpiValue: { fontFamily: "Helvetica-Bold", fontSize: 15, color: COLORS.ink },
  kpiLabel: { fontSize: 6.8, color: COLORS.muted, textTransform: "uppercase", marginTop: 2 },
  photos: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  photo: { width: "49%", borderWidth: 0.6, borderColor: COLORS.border, marginBottom: 8 },
  photoImage: { width: "100%", height: 168, objectFit: "cover" },
  photoCaption: { paddingVertical: 4, paddingHorizontal: 6 },
  signatures: { flexDirection: "row", gap: 18, marginTop: 30 },
  signature: { flex: 1, alignItems: "center" },
  signatureLine: { width: "100%", borderTopWidth: 0.8, borderTopColor: COLORS.ink, marginBottom: 3 },
  writeLine: { height: 18, borderBottomWidth: 0.6, borderBottomColor: COLORS.border },
});

/** Turns relative URLs (e.g. Next static assets) into absolute ones so the PDF renderer can fetch them. */
export function resolveAssetUrl(url: string | { src: string }): string {
  const raw = typeof url === "string" ? url : url?.src ?? "";
  if (/^(data:|https?:)/i.test(raw) || typeof window === "undefined") return raw;
  return new URL(raw, window.location.origin).href;
}

const preparedPhotoCache = new Map<string, string | null>();

/**
 * Normalizes any image URL (including WebP data URLs or external URLs) into a JPEG/PNG data URL
 * supported by @react-pdf/renderer. Returns null if the image cannot be loaded, preventing PDF crashes.
 */
export async function preparePhotoUrlForPdf(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== "string") return null;
  if (/^data:image\/(png|jpe?g);base64,/i.test(url)) return url;
  if (typeof window === "undefined" || typeof document === "undefined") return resolveAssetUrl(url);

  if (preparedPhotoCache.has(url)) {
    return preparedPhotoCache.get(url) ?? null;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => {
      preparedPhotoCache.set(url, null);
      resolve(null);
    }, 2000);

    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const maxDim = 800;
        let width = img.naturalWidth || img.width || 640;
        let height = img.naturalHeight || img.height || 480;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const converted = canvas.toDataURL("image/jpeg", 0.82);
        preparedPhotoCache.set(url, converted);
        resolve(converted);
      } catch {
        preparedPhotoCache.set(url, null);
        resolve(null);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      preparedPhotoCache.set(url, null);
      resolve(null);
    };

    img.src = resolveAssetUrl(url);
  });
}

export function DocumentShell({
  title,
  subtitle,
  code,
  issuedOn,
  watermark,
  children,
}: {
  title: string;
  subtitle?: string;
  code: string;
  issuedOn: string; // already formatted (dd/mm/yyyy)
  watermark?: string;
  children: ReactNode;
}) {
  const generatedAt = formatDocumentDateTime(new Date());
  return (
    <Document title={`${code} · ${title}`} author={`${COMPANY.name} · ${COMPANY.tagline}`} creator={COMPANY.system} producer={COMPANY.system} language="pt-BR">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.headerRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            <Image src={resolveAssetUrl(logo)} style={s.logo} />
            <View style={s.headerCenter}>
              <Text style={s.eyebrow}>Saúde, Meio Ambiente e Segurança</Text>
              <Text style={s.docTitle}>{title}</Text>
              {subtitle ? <Text style={s.docSubtitle}>{subtitle}</Text> : null}
            </View>
            <View style={s.control}>
              <View style={s.controlRow}>
                <Text style={s.controlLabel}>Documento</Text>
                <Text style={s.controlValue}>{code}</Text>
              </View>
              <View style={s.controlRow}>
                <Text style={s.controlLabel}>Emissão</Text>
                <Text style={s.controlValue}>{issuedOn}</Text>
              </View>
              <View style={s.controlRowLast}>
                <Text style={s.controlLabel}>Página</Text>
                <Text style={s.controlValue} render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
              </View>
            </View>
          </View>
          <View style={s.headerRule} />
          <View style={s.headerRuleThin} />
        </View>

        {watermark ? (
          <Text style={s.watermark} fixed>
            {watermark}
          </Text>
        ) : null}

        {children}

        <View style={s.footer} fixed>
          <Text>
            {COMPANY.name} · {COMPANY.tagline}  |  Documento gerado pelo sistema {COMPANY.system} em {generatedAt}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function Section({
  number,
  title,
  aside,
  breakBefore,
  keepTogether,
  children,
}: {
  number: number;
  title: string;
  aside?: string;
  breakBefore?: boolean;
  keepTogether?: boolean; // moves the whole section to the next page instead of splitting it
  children: ReactNode;
}) {
  return (
    <View style={s.section} break={breakBefore} wrap={!keepTogether}>
      {/* Keeps the heading together with the start of its content. */}
      <View style={s.sectionTitle} minPresenceAhead={100} wrap={false}>
        <Text style={s.sectionText}>
          {number}. {title}
        </Text>
        {aside ? <Text style={s.sectionAside}>{aside}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export interface Field {
  label: string;
  value: ReactNode;
  span?: number; // columns taken by the cell
}

/** Bordered form-like grid of label/value cells. */
export function FieldGrid({ fields, columns = 4 }: { fields: Field[]; columns?: number }) {
  return (
    <View style={s.grid} wrap={false}>
      {fields.map((f, i) => (
        <View key={i} style={[s.cell, { width: `${(Math.min(f.span ?? 1, columns) / columns) * 100}%` }]}>
          <Text style={s.cellLabel}>{f.label}</Text>
          {typeof f.value === "string" || typeof f.value === "number" ? (
            <Text style={s.cellValue}>{f.value === "" ? "—" : f.value}</Text>
          ) : (
            f.value
          )}
        </View>
      ))}
    </View>
  );
}

export interface Column {
  header: string;
  flex: number;
  align?: "left" | "center" | "right";
}

/** Table with a dark header, zebra rows and rows that never split across pages. */
export function DataTable({
  columns,
  rows,
  emptyText = "Nenhum registro.",
  footer,
}: {
  columns: Column[];
  rows: ReactNode[][];
  emptyText?: string;
  footer?: ReactNode[];
}) {
  if (!rows.length) return <Text style={s.empty}>{emptyText}</Text>;
  const cell = (content: ReactNode, col: Column, bold = false) =>
    typeof content === "string" || typeof content === "number" ? (
      <Text style={[s.td, { textAlign: col.align ?? "left" }, bold ? { fontFamily: "Helvetica-Bold" } : {}]}>{content}</Text>
    ) : (
      <View style={s.td}>{content}</View>
    );

  return (
    <View style={s.table}>
      <View style={[s.trLast, { backgroundColor: COLORS.ink }]} fixed>
        {columns.map((c, i) => (
          <Text key={i} style={[s.th, { flex: c.flex, textAlign: c.align ?? "left" }]}>
            {c.header}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View
          key={r}
          wrap={false}
          style={[r === rows.length - 1 && !footer ? s.trLast : s.tr, { backgroundColor: r % 2 ? COLORS.soft : COLORS.white }]}
        >
          {row.map((content, i) => (
            <View key={i} style={{ flex: columns[i].flex }}>
              {cell(content, columns[i])}
            </View>
          ))}
        </View>
      ))}
      {footer ? (
        <View style={[s.trLast, { backgroundColor: COLORS.brandSoft }]} wrap={false}>
          {footer.map((content, i) => (
            <View key={i} style={{ flex: columns[i].flex }}>
              {cell(content, columns[i], true)}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function Tag({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return <Text style={[s.tag, { backgroundColor: t.bg, color: t.fg, borderColor: t.border }]}>{label}</Text>;
}

export function TextBox({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[s.textBox, muted ? { color: COLORS.muted } : {}]}>{children}</Text>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <Text style={s.empty}>{children}</Text>;
}

export function KpiRow({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <View style={s.kpis} wrap={false}>
      {items.map((k, i) => (
        <View key={i} style={s.kpi}>
          <Text style={s.kpiValue}>{k.value}</Text>
          <Text style={s.kpiLabel}>{k.label}</Text>
        </View>
      ))}
    </View>
  );
}

export interface PdfPhoto {
  src: string;
  caption: string;
  meta?: string;
}

export function PhotoGrid({ photos }: { photos: PdfPhoto[] }) {
  return (
    <View style={s.photos}>
      {photos.map((p, i) => (
        <View key={i} style={s.photo} wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={resolveAssetUrl(p.src)} style={s.photoImage} />
          <View style={s.photoCaption}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.8, color: COLORS.ink }}>
              Foto {i + 1} · {p.caption}
            </Text>
            {p.meta ? <Text style={{ fontSize: 7, color: COLORS.muted, marginTop: 1 }}>{p.meta}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export interface Signer {
  role: string;
  name?: string | null;
  detail?: string | null;
}

/** Signature lines; names are printed under the line when known. */
export function SignatureBlock({ signers }: { signers: Signer[] }) {
  return (
    <View style={s.signatures} wrap={false}>
      {signers.map((sg, i) => (
        <View key={i} style={s.signature}>
          <View style={s.signatureLine} />
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.4, color: COLORS.ink, textAlign: "center" }}>
            {sg.name || " "}
          </Text>
          <Text style={{ fontSize: 7.2, color: COLORS.muted, textAlign: "center" }}>{sg.role}</Text>
          <Text style={{ fontSize: 7, color: COLORS.muted, textAlign: "center", marginTop: 2 }}>
            {sg.detail || "Data: ____/____/________"}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Empty ruled area to be filled by hand on the printed copy. */
export function WriteInArea({ lines = 4 }: { lines?: number }) {
  return (
    <View style={{ borderWidth: 0.6, borderColor: COLORS.border, paddingHorizontal: 7, paddingBottom: 6 }} wrap={false}>
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={s.writeLine} />
      ))}
    </View>
  );
}

export function SubHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 4 }}
      minPresenceAhead={50}
      wrap={false}
    >
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.8, color: COLORS.ink }}>{children}</Text>
      {aside ? <View style={{ marginLeft: "auto" }}>{aside}</View> : null}
    </View>
  );
}

export const bold = { fontFamily: "Helvetica-Bold" } as const;
export const mutedText = { color: COLORS.muted, fontSize: 7.4 } as const;

export type PdfDocumentElement = React.ReactElement<DocumentProps>;
