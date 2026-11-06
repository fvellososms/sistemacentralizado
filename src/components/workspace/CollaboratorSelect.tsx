"use client";

import React from "react";
import type { TeamMember } from "./api";

/**
 * Selector of active system users. When editing a record whose collaborator was deactivated,
 * that person is still listed so the record keeps showing who did it.
 */
export function CollaboratorSelect({
  id,
  team,
  value,
  current,
  onChange,
  className,
}: {
  id: string;
  team: TeamMember[];
  value: number | null | undefined;
  current?: { id: number | null; name: string };
  onChange: (id: number) => void;
  className: string;
}) {
  const missingCurrent = current?.id && !team.some((m) => m.id === current.id);
  return (
    <select id={id} value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} className={className}>
      <option value="" disabled>{team.length ? "Selecione o colaborador" : "Carregando equipe…"}</option>
      {missingCurrent && <option value={current!.id!}>{current!.name} (desativado)</option>}
      {team.map((m) => (
        <option key={m.id} value={m.id}>{m.name}{m.role ? ` · ${m.role}` : ""}</option>
      ))}
    </select>
  );
}
