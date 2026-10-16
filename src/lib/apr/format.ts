export function formatarData(iso: string | null | undefined, comHora = false) {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString(
    "pt-BR",
    comHora ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" } : undefined,
  );
}
