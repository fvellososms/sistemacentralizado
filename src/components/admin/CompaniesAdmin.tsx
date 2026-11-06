"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui";
import { validateClientCompany, type ClientCompany, type ClientCompanyErrors, type ClientCompanyInput } from "@/modules/clients";
import type { Project } from "@/modules/projects";
import { EmptyPanel, ModalShell, Notice, Panel, inputClass, labelClass, readApiError, useFetched, type NoticeState } from "@/components/workspace/shared";
import { AdminShell, ConfirmAction, Pill, sendJson } from "./AdminShell";

const NO_COMPANIES: ClientCompany[] = [];
const NO_PROJECTS: Project[] = [];

export async function fetchCompanies(): Promise<ClientCompany[]> {
  const res = await fetch("/api/admin/empresas");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar as empresas."));
  return (await res.json()).companies ?? [];
}

export async function fetchAdminProjects(): Promise<Project[]> {
  const res = await fetch("/api/admin/obras");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar as obras."));
  return (await res.json()).projects ?? [];
}

export function CompaniesAdmin() {
  const { data: companies, loading, error, reload } = useFetched(fetchCompanies, NO_COMPANIES);
  const { data: projects } = useFetched(fetchAdminProjects, NO_PROJECTS);
  const [editing, setEditing] = useState<{ company: ClientCompany | null } | null>(null);
  const [toggling, setToggling] = useState<ClientCompany | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const projectsByCompany = useMemo(() => {
    const map = new Map<number, Project[]>();
    for (const p of projects) if (p.clientCompanyId) map.set(p.clientCompanyId, [...(map.get(p.clientCompanyId) ?? []), p]);
    return map;
  }, [projects]);

  const toggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      await sendJson(`/api/admin/empresas/${toggling.id}`, "PATCH", { active: !toggling.active });
      setNotice({ ok: true, text: `${toggling.name} ${toggling.active ? "desativada" : "reativada"}.` });
      reload();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "A operação não foi concluída." });
    } finally {
      setBusy(false);
      setToggling(null);
    }
  };

  return (
    <AdminShell
      title="Empresas clientes"
      description="Cadastro das empresas atendidas. As ativas aparecem como sugestão nos formulários do sistema."
      actions={
        <Button onClick={() => setEditing({ company: null })}>
          <Plus className="w-4 h-4" />
          Nova empresa
        </Button>
      }
    >
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Panel title="Empresas cadastradas" description={`${companies.filter((c) => c.active).length} ativa(s) de ${companies.length}`}>
        {loading ? (
          <div className="p-10 text-center text-[13px] text-slate-500">Carregando empresas…</div>
        ) : error ? (
          <p role="alert" className="m-6 p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
        ) : companies.length === 0 ? (
          <EmptyPanel title="Nenhuma empresa cadastrada." description="Use “Nova empresa” para começar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  {["Empresa", "CNPJ", "Contato", "Obras", "Situação", ""].map((h, i) => (
                    <th key={i} className={`py-3 ${i === 0 ? "px-6" : "px-3"} font-medium text-[11px] uppercase tracking-wider`}>
                      {h || <span className="sr-only">Ações</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => {
                  const linked = projectsByCompany.get(c.id) ?? [];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-6 font-medium text-slate-900">{c.name}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{c.cnpj || "—"}</td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800">{c.contactName || "—"}</div>
                        <div className="text-[12px] text-slate-500">{[c.contactEmail, c.contactPhone].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="py-3 px-3 text-[12px] text-slate-600" title={linked.map((p) => p.name).join(", ")}>
                        {linked.length ? `${linked.length} · ${linked.map((p) => p.code).join(", ")}` : "—"}
                      </td>
                      <td className="py-3 px-3">{c.active ? <Pill tone="green">Ativa</Pill> : <Pill tone="slate">Inativa</Pill>}</td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" title={`Editar ${c.name}`} aria-label={`Editar ${c.name}`} onClick={() => setEditing({ company: c })} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" title={c.active ? `Desativar ${c.name}` : `Reativar ${c.name}`} aria-label={c.active ? `Desativar ${c.name}` : `Reativar ${c.name}`} onClick={() => setToggling(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition">
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <CompanyFormModal
          company={editing.company}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            reload();
          }}
        />
      )}

      <ConfirmAction
        isOpen={Boolean(toggling)}
        title={toggling?.active ? "Desativar empresa" : "Reativar empresa"}
        description={
          toggling?.active
            ? `${toggling.name} deixará de aparecer como sugestão nos formulários. Obras e registros existentes não são alterados.`
            : `${toggling?.name} voltará a aparecer como sugestão nos formulários.`
        }
        confirmText={toggling?.active ? "Desativar" : "Reativar"}
        danger={toggling?.active}
        isLoading={busy}
        onConfirm={() => void toggle()}
        onCancel={() => setToggling(null)}
      />
    </AdminShell>
  );
}

function CompanyFormModal({ company, onClose, onSaved }: { company: ClientCompany | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<ClientCompanyInput>({
    name: company?.name ?? "",
    cnpj: company?.cnpj ?? "",
    contactName: company?.contactName ?? "",
    contactEmail: company?.contactEmail ?? "",
    contactPhone: company?.contactPhone ?? "",
  });
  const [errors, setErrors] = useState<ClientCompanyErrors>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = (k: keyof ClientCompanyInput, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const { isValid, errors: found } = validateClientCompany(form);
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      if (company) await sendJson(`/api/admin/empresas/${company.id}`, "PATCH", form);
      else await sendJson("/api/admin/empresas", "POST", form);
      onSaved(company ? "Empresa atualizada." : "Empresa cadastrada.");
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar a empresa.");
    } finally {
      setSaving(false);
    }
  };

  const input = (k: keyof ClientCompanyInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = false) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={`emp-${k}`} className={labelClass}>{label}</label>
      <input
        id={`emp-${k}`}
        value={(form[k] as string) ?? ""}
        onChange={(e) => set(k, e.target.value)}
        className={`${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`}
        {...props}
      />
      {errors[k] && <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p>}
    </div>
  );

  return (
    <ModalShell
      eyebrow="Administração"
      title={company ? "Editar empresa" : "Nova empresa cliente"}
      titleId="empresa-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving}>{company ? "Salvar alterações" : "Cadastrar empresa"}</Button>
        </>
      }
    >
      {generalError && <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{generalError}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {input("name", "Nome da empresa *", { maxLength: 180 }, true)}
        {input("cnpj", "CNPJ", { placeholder: "00.000.000/0000-00", inputMode: "numeric" })}
        {input("contactName", "Contato")}
        {input("contactEmail", "E-mail do contato", { type: "email" })}
        {input("contactPhone", "Telefone do contato", { type: "tel" })}
      </div>
    </ModalShell>
  );
}
