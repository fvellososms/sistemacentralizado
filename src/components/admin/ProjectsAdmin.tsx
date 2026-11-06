"use client";

import React, { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { PROJECT_STATUSES, validateProject, type Project, type ProjectErrors, type ProjectInput } from "@/modules/projects";
import type { ClientCompany } from "@/modules/clients";
import { EmptyPanel, ModalShell, Notice, Panel, inputClass, labelClass, useFetched, type NoticeState } from "@/components/workspace/shared";
import { AdminShell, Pill, sendJson } from "./AdminShell";
import { fetchAdminProjects, fetchCompanies } from "./CompaniesAdmin";

const NO_COMPANIES: ClientCompany[] = [];
const NO_PROJECTS: Project[] = [];

export function ProjectsAdmin() {
  const { refreshProjects } = useApp();
  const { data: projects, loading, error, reload } = useFetched(fetchAdminProjects, NO_PROJECTS);
  const { data: companies } = useFetched(fetchCompanies, NO_COMPANIES);
  const [editing, setEditing] = useState<{ project: Project | null } | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const unlinked = projects.filter((p) => !p.clientCompanyId).length;

  return (
    <AdminShell
      title="Obras"
      description="Cadastro das obras e da empresa cliente a que cada uma pertence."
      actions={
        <Button onClick={() => setEditing({ project: null })}>
          <Plus className="w-4 h-4" />
          Nova obra
        </Button>
      }
    >
      <Notice notice={notice} onClose={() => setNotice(null)} />
      {unlinked > 0 && !loading && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-800">
          {unlinked} obra(s) ainda sem empresa cliente. Use o lápis para vincular.
        </div>
      )}
      <Panel title="Obras cadastradas" description={`${projects.length} obra(s)`}>
        {loading ? (
          <div className="p-10 text-center text-[13px] text-slate-500">Carregando obras…</div>
        ) : error ? (
          <p role="alert" className="m-6 p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
        ) : projects.length === 0 ? (
          <EmptyPanel title="Nenhuma obra cadastrada." description="Use “Nova obra” para cadastrar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  {["Obra", "Empresa cliente", "Construtora / responsável", "Situação", ""].map((h, i) => (
                    <th key={i} className={`py-3 ${i === 0 ? "px-6" : "px-3"} font-medium text-[11px] uppercase tracking-wider`}>
                      {h || <span className="sr-only">Ações</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-6">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-[12px] text-slate-500 font-mono">{p.code}</div>
                    </td>
                    <td className="py-3 px-3">{p.clientCompanyName ? <Pill tone="blue">{p.clientCompanyName}</Pill> : <Pill tone="amber">Sem vínculo</Pill>}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800">{p.companyName}</div>
                      <div className="text-[12px] text-slate-500">{p.managerName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.status}</td>
                    <td className="py-3 px-6 text-right">
                      <button type="button" title={`Editar ${p.name}`} aria-label={`Editar ${p.name}`} onClick={() => setEditing({ project: p })} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <ProjectFormModal
          project={editing.project}
          companies={companies}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            reload();
            void refreshProjects(); // keeps the "obra ativa" selector in sync
          }}
        />
      )}
    </AdminShell>
  );
}

function ProjectFormModal({
  project,
  companies,
  onClose,
  onSaved,
}: {
  project: Project | null;
  companies: ClientCompany[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<ProjectInput>({
    name: project?.name ?? "",
    code: project?.code ?? "",
    address: project?.address ?? "",
    companyName: project?.companyName ?? "",
    managerName: project?.managerName ?? "",
    status: project?.status ?? "Em andamento",
    startDate: project?.startDate ?? new Date().toISOString().slice(0, 10),
    clientCompanyId: project?.clientCompanyId ?? null,
  });
  const [errors, setErrors] = useState<ProjectErrors>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const { isValid, errors: found } = validateProject(form);
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      if (project) await sendJson(`/api/admin/obras/${project.id}`, "PATCH", form);
      else await sendJson("/api/admin/obras", "POST", form);
      onSaved(project ? "Obra atualizada." : "Obra cadastrada.");
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar a obra.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof ProjectInput) => `${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`;
  const error = (k: keyof ProjectInput) => (errors[k] ? <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p> : null);
  const text = (k: "name" | "code" | "address" | "companyName" | "managerName", label: string, span = false) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={`obra-${k}`} className={labelClass}>{label}</label>
      <input id={`obra-${k}`} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={field(k)} />
      {error(k)}
    </div>
  );

  return (
    <ModalShell
      eyebrow="Administração"
      title={project ? "Editar obra" : "Nova obra"}
      titleId="obra-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving}>{project ? "Salvar alterações" : "Cadastrar obra"}</Button>
        </>
      }
    >
      {generalError && <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{generalError}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {text("name", "Nome da obra *")}
        {text("code", "Código *")}
        <div className="sm:col-span-2">
          <label htmlFor="obra-cliente" className={labelClass}>Empresa cliente</label>
          <select
            id="obra-cliente"
            value={form.clientCompanyId ?? ""}
            onChange={(e) => set("clientCompanyId", e.target.value ? Number(e.target.value) : null)}
            className={field("clientCompanyId")}
          >
            <option value="">Sem vínculo</option>
            {companies
              .filter((c) => c.active || c.id === form.clientCompanyId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inativa)"}</option>
              ))}
          </select>
          {error("clientCompanyId")}
        </div>
        {text("address", "Endereço *", true)}
        {text("companyName", "Construtora / contratante *")}
        {text("managerName", "Responsável técnico *")}
        <div>
          <label htmlFor="obra-status" className={labelClass}>Situação *</label>
          <select id="obra-status" value={form.status ?? ""} onChange={(e) => set("status", e.target.value)} className={field("status")}>
            {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {error("status")}
        </div>
        <div>
          <label htmlFor="obra-inicio" className={labelClass}>Data de início *</label>
          <input id="obra-inicio" type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} className={field("startDate")} />
          {error("startDate")}
        </div>
      </div>
    </ModalShell>
  );
}
