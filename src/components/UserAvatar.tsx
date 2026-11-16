"use client";

import React from "react";

/** First letters of the first and last names: "Fábio Velloso" -> "FV". */
export function nameInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Profile photo, or the initials of the name when the user has no photo. */
export function UserAvatar({
  name,
  url,
  className = "w-10 h-10 text-[13px]",
}: {
  name: string | null | undefined;
  url: string | null | undefined;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- uploaded photo (data URL)
    return <img src={url} alt={name || "Usuário"} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <span
      role="img"
      aria-label={name || "Usuário"}
      className={`${className} rounded-full bg-gradient-to-br from-blue-600 to-slate-800 text-white font-semibold flex items-center justify-center select-none`}
    >
      {nameInitials(name)}
    </span>
  );
}
