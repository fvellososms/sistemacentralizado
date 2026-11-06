"use client";

import React, { useMemo, useState } from "react";
import { Copy, KeyRound, Lock, Pencil, Plus, Search, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui";
import { ACCESS_LEVELS, validateUserAccount, type AccessLevel, type UserAccountErrors, type UserAccountInput } from "@/modules/users";
import type { AdminUserView } from "@/modules/users/application/admin-users";
import { EmptyPanel, ModalShell, Notice, Panel, inputClass, labelClass, readApiError, useFetched, type NoticeState } from "@/components/workspace/shared";
import { AdminShell, ConfirmAction, Pill, formatDateTime, sendJson } from "./AdminShell";

const NO_USERS: AdminUserView[] = [];

async function fetchUsers(): Promise<AdminUserView[]> {
  const res = await fetch("/api/admin/usuarios");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar os usuários."));
  return (await res.json()).users ?? [];
}

function UserStatus({ user }: { user: AdminUserView }) {
  if (!user.active) return <Pill tone="slate">Desativado</Pill>;
  if (user.locked) return <Pill tone="red">Bloqueado</Pill>;
  if (user.mustChangePassword) return <Pill tone="amber">Senha temporária</Pill>;
  return <Pill tone="green">Ativo</Pill>;
}

export function UsersAdmin() {
  const { data: users, loading, error, reload } = useFetched(fetchUsers, NO_USERS);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ user: AdminUserView | null } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "reset" | "toggle"; user: AdminUserView } | null>(null);
  const [busy, setBusy] = useState(false);
  const [temporary, setTemporary] = useState<{ name: string; email: string; password: string } | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return q ? users.filter((u) => `${u.name} ${u.email} ${u.role} ${u.department}`.toLocaleLowerCase("pt-BR").includes(q)) : users;
  }, [users, query]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      reload();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : "A operação não foi concluída." });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const confirmAction = () =>
    confirm &&
    run(async () => {
      if (confirm.kind === "reset") {
        const r = await sendJson<{ temporaryPassword: string }>(`/api/admin/usuarios/${confirm.user.id}/senha`, "POST");
        setTemporary({ name: confirm.user.name, email: confirm.user.email, password: r.temporaryPassword });
      } else {
        await sendJson(`/api/admin/usuarios/${confirm.user.id}`, "PATCH", { active: !confirm.user.active });
        setNotice({ ok: true, text: `${confirm.user.name} ${confirm.user.active ? "desativado" : "reativado"}.` });
      }
    });

  return (
    <AdminShell
      title="Usuários"
      description="Crie e gerencie os acessos de funcionários e outros utilizadores do sistema."
      actions={
        <Button onClick={() => setEditing({ user: null })}>
          <Plus className="w-4 h-4" />
          Novo usuário
        </Button>
      }
    >
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Panel
        title="Contas de acesso"
        description={`${users.length} usuário(s) · ${users.filter((u) => u.active).length} ativo(s)`}
        action={
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuário…"
              aria-label="Buscar usuário"
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-100"
            />
          </div>
        }
      >
        {loading ? (
          <div className="p-10 text-center text-[13px] text-slate-500">Carregando usuários…</div>
        ) : error ? (
          <p role="alert" className="m-6 p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyPanel title="Nenhum usuário encontrado." description="Use “Novo usuário” para criar um acesso." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  {["Usuário", "Cargo / departamento", "Acesso", "Situação", "Último acesso", ""].map((h, i) => (
                    <th key={i} className={`py-3 ${i === 0 ? "px-6" : "px-3"} font-medium text-[11px] uppercase tracking-wider`}>
                      {h || <span className="sr-only">Ações</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-6">
                      <div className="font-medium text-slate-900">
                        {u.name}
                        {u.isMainAdmin && <span className="ml-2 text-[10.5px] font-semibold text-blue-600">principal</span>}
                      </div>
                      <div className="text-[12px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800">{u.role}</div>
                      <div className="text-[12px] text-slate-500">{u.department}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Pill tone={u.accessLevel === "admin" ? "blue" : "slate"}>{ACCESS_LEVELS[u.accessLevel]}</Pill>
                    </td>
                    <td className="py-3 px-3"><UserStatus user={u} /></td>
                    <td className="py-3 px-3 text-[12px] text-slate-500 whitespace-nowrap">{formatDateTime(u.lastLoginAt)}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label={`Editar ${u.name}`} onClick={() => setEditing({ user: u })}><Pencil className="w-3.5 h-3.5" /></IconAction>
                        <IconAction label={`Redefinir senha de ${u.name}`} onClick={() => setConfirm({ kind: "reset", user: u })}><KeyRound className="w-3.5 h-3.5" /></IconAction>
                        {u.locked && (
                          <IconAction label={`Desbloquear ${u.name}`} onClick={() => run(async () => {
                            await sendJson(`/api/admin/usuarios/${u.id}/desbloquear`, "POST");
                            setNotice({ ok: true, text: `${u.name} desbloqueado.` });
                          })}>
                            <Lock className="w-3.5 h-3.5" />
                          </IconAction>
                        )}
                        {!u.isMainAdmin && (
                          <IconAction
                            label={u.active ? `Desativar ${u.name}` : `Reativar ${u.name}`}
                            danger={u.active}
                            onClick={() => setConfirm({ kind: "toggle", user: u })}
                          >
                            {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </IconAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <UserFormModal
          user={editing.user}
          onClose={() => setEditing(null)}
          onSaved={(message, temp) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            if (temp) setTemporary(temp);
            reload();
          }}
        />
      )}

      {temporary && <TemporaryPasswordModal {...temporary} onClose={() => setTemporary(null)} />}

      <ConfirmAction
        isOpen={Boolean(confirm)}
        danger={confirm?.kind === "toggle" && confirm.user.active}
        title={confirm?.kind === "reset" ? "Redefinir senha" : confirm?.user.active ? "Desativar usuário" : "Reativar usuário"}
        description={
          confirm?.kind === "reset"
            ? `Uma nova senha temporária será gerada para ${confirm.user.name}. A senha atual deixa de funcionar e a troca será obrigatória no próximo acesso.`
            : confirm?.user.active
              ? `${confirm?.user.name} não poderá mais entrar no sistema. Os registros feitos por essa pessoa são mantidos.`
              : `${confirm?.user.name} poderá entrar novamente no sistema.`
        }
        confirmText={confirm?.kind === "reset" ? "Gerar nova senha" : confirm?.user.active ? "Desativar" : "Reativar"}
        isLoading={busy}
        onConfirm={() => void confirmAction()}
        onCancel={() => setConfirm(null)}
      />
    </AdminShell>
  );
}

function IconAction({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-slate-500 transition ${danger ? "hover:text-red-600 hover:bg-red-50" : "hover:text-slate-900 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUserView | null;
  onClose: () => void;
  onSaved: (message: string, temporary?: { name: string; email: string; password: string }) => void;
}) {
  const [form, setForm] = useState<Partial<UserAccountInput>>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "",
    department: user?.department ?? "SMS",
    accessLevel: user?.accessLevel ?? "usuario",
    password: "",
  });
  const [errors, setErrors] = useState<UserAccountErrors>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = <K extends keyof UserAccountInput>(k: K, v: UserAccountInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const payload = { ...form, password: form.password?.trim() || null };
    const { isValid, errors: found } = validateUserAccount(payload);
    setErrors(found);
    if (!isValid) return;
    setSaving(true);
    setGeneralError(null);
    try {
      if (user) {
        await sendJson(`/api/admin/usuarios/${user.id}`, "PATCH", { name: form.name, email: form.email, role: form.role, department: form.department, accessLevel: form.accessLevel });
        onSaved("Usuário atualizado.");
      } else {
        const r = await sendJson<{ user: AdminUserView; temporaryPassword: string }>("/api/admin/usuarios", "POST", payload);
        onSaved("Usuário criado.", { name: r.user.name, email: r.user.email, password: r.temporaryPassword });
      }
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : "Falha ao salvar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof UserAccountInput) => `${inputClass} ${errors[k] ? "border-red-300" : "border-slate-200"}`;
  const error = (k: keyof UserAccountInput) => (errors[k] ? <p className="text-[11.5px] text-red-600 mt-1">{errors[k]}</p> : null);
  const lockedAccess = user?.isMainAdmin;

  return (
    <ModalShell
      eyebrow="Administração"
      title={user ? "Editar usuário" : "Novo usuário"}
      titleId="usuario-form-titulo"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={() => void save()} loading={saving}>{user ? "Salvar alterações" : "Criar usuário"}</Button>
        </>
      }
    >
      {generalError && <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{generalError}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="u-nome" className={labelClass}>Nome completo *</label>
          <input id="u-nome" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} className={field("name")} />
          {error("name")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="u-email" className={labelClass}>E-mail de acesso *</label>
          <input id="u-email" type="email" disabled={lockedAccess} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className={field("email")} />
          {error("email")}
        </div>
        <div>
          <label htmlFor="u-cargo" className={labelClass}>Cargo *</label>
          <input id="u-cargo" placeholder="Ex.: Técnico de Segurança" value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} className={field("role")} />
          {error("role")}
        </div>
        <div>
          <label htmlFor="u-depto" className={labelClass}>Departamento *</label>
          <input id="u-depto" value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} className={field("department")} />
          {error("department")}
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass} id="u-acesso">Nível de acesso *</span>
          <div role="radiogroup" aria-labelledby="u-acesso" className="grid grid-cols-2 gap-2">
            {(Object.keys(ACCESS_LEVELS) as AccessLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={form.accessLevel === level}
                disabled={lockedAccess}
                onClick={() => set("accessLevel", level)}
                className={`px-3 py-2.5 rounded-xl border text-left transition disabled:opacity-60 ${
                  form.accessLevel === level ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block text-[13px] font-semibold text-slate-900">{ACCESS_LEVELS[level]}</span>
                <span className="block text-[11.5px] text-slate-500">
                  {level === "admin" ? "Gerencia usuários, empresas, obras e verifica NCs" : "Usa o sistema no dia a dia"}
                </span>
              </button>
            ))}
          </div>
          {lockedAccess && <p className="text-[11.5px] text-slate-500 mt-1">O administrador principal mantém sempre o acesso de administrador.</p>}
        </div>
        {!user && (
          <div className="sm:col-span-2">
            <label htmlFor="u-senha" className={labelClass}>
              Senha temporária <span className="font-normal text-slate-400">opcional · deixe em branco para gerar automaticamente</span>
            </label>
            <input id="u-senha" type="text" autoComplete="off" value={form.password ?? ""} onChange={(e) => set("password", e.target.value)} className={field("password")} />
            {error("password")}
            <p className="text-[11.5px] text-slate-500 mt-1">No primeiro acesso, a pessoa será obrigada a criar uma senha própria.</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function TemporaryPasswordModal({ name, email, password, onClose }: { name: string; email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Acesso FVelloso SMS\nE-mail: ${email}\nSenha temporária: ${password}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <ModalShell
      eyebrow="Senha temporária"
      title={`Acesso de ${name}`}
      titleId="senha-temporaria-titulo"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={() => void copy()}>
            <Copy className="w-4 h-4" />
            {copied ? "Copiado!" : "Copiar dados de acesso"}
          </Button>
          <Button onClick={onClose}>Concluir</Button>
        </>
      }
    >
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-[12.5px] text-amber-900">
        Anote ou copie agora: por segurança, esta senha <strong>não será mostrada novamente</strong>. Envie-a à pessoa por um canal privado.
      </div>
      <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
        <dt className="text-slate-500">E-mail</dt>
        <dd className="font-medium text-slate-900">{email}</dd>
        <dt className="text-slate-500">Senha temporária</dt>
        <dd className="font-mono text-[15px] font-semibold text-slate-900 tracking-wider select-all">{password}</dd>
      </dl>
      <p className="text-[12px] text-slate-500">No primeiro acesso, o sistema pedirá que a pessoa crie uma senha pessoal.</p>
    </ModalShell>
  );
}
