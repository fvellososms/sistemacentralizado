"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Search, ShieldAlert, Users } from "lucide-react";
import { AUDIT_ENTITIES, auditActionLabel, type AuditEntity } from "@/modules/audit";
import type { AdminUserView } from "@/modules/users/application/admin-users";
import type { ClientCompany } from "@/modules/clients";
import type { Project } from "@/modules/projects";
import { EmptyPanel, MetricCard, Panel, readApiError, useFetched } from "@/components/workspace/shared";
import { AdminShell, formatDateTime } from "./AdminShell";
import { fetchAdminProjects, fetchCompanies } from "./CompaniesAdmin";

interface AuditLog {
  id: number;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

const NO_LOGS: AuditLog[] = [];

async function fetchLogs(): Promise<AuditLog[]> {
  const res = await fetch("/api/admin/auditoria?limite=300");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar a auditoria."));
  return (await res.json()).logs ?? [];
}

function AuditTable({ logs }: { logs: AuditLog[] }) {
  if (!logs.length) return <EmptyPanel title="Nenhum registro de auditoria." description="As ações administrativas aparecem aqui." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500">
            {["Data", "Quem", "Ação", "Registro", "Detalhes"].map((h, i) => (
              <th key={h} className={`py-3 ${i === 0 ? "px-6" : "px-3"} font-medium text-[11px] uppercase tracking-wider`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/50 transition align-top">
              <td className="py-3 px-6 text-[12px] text-slate-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
              <td className="py-3 px-3 text-slate-800">{l.actorName ?? "Sistema"}</td>
              <td className="py-3 px-3 font-medium text-slate-900">{auditActionLabel(l.action)}</td>
              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                {AUDIT_ENTITIES[l.entity as AuditEntity] ?? l.entity}
                {l.entityId ? ` #${l.entityId}` : ""}
              </td>
              <td className="py-3 px-3 text-[12px] text-slate-600">{l.details ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditAdmin() {
  const { data: logs, loading, error } = useFetched(fetchLogs, NO_LOGS);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return q
      ? logs.filter((l) => `${l.actorName} ${auditActionLabel(l.action)} ${l.details}`.toLocaleLowerCase("pt-BR").includes(q))
      : logs;
  }, [logs, query]);

  return (
    <AdminShell title="Auditoria" description="Registro de quem criou, alterou, bloqueou ou verificou cada item administrativo.">
      <Panel
        title="Últimas ações"
        description={`${filtered.length} registro(s)`}
        action={
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por pessoa ou ação…"
              aria-label="Buscar na auditoria"
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-100"
            />
          </div>
        }
      >
        {loading ? (
          <div className="p-10 text-center text-[13px] text-slate-500">Carregando…</div>
        ) : error ? (
          <p role="alert" className="m-6 p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>
        ) : (
          <AuditTable logs={filtered} />
        )}
      </Panel>
    </AdminShell>
  );
}

const NO_USERS: AdminUserView[] = [];
const NO_COMPANIES: ClientCompany[] = [];
const NO_PROJECTS: Project[] = [];

async function fetchUsers(): Promise<AdminUserView[]> {
  const res = await fetch("/api/admin/usuarios");
  if (!res.ok) throw new Error(await readApiError(res, "Não foi possível carregar os usuários."));
  return (await res.json()).users ?? [];
}

const tag = (text: string) => <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{text}</span>;

export function AdminOverview() {
  const users = useFetched(fetchUsers, NO_USERS);
  const companies = useFetched(fetchCompanies, NO_COMPANIES);
  const projects = useFetched(fetchAdminProjects, NO_PROJECTS);
  const logs = useFetched(fetchLogs, NO_LOGS);
  const error = users.error || companies.error || projects.error;

  const activeUsers = users.data.filter((u) => u.active);
  const attention = users.data.filter((u) => u.locked).length + projects.data.filter((p) => !p.clientCompanyId).length;

  return (
    <AdminShell title="Administração" description="Usuários, empresas clientes, obras e registro de ações do sistema.">
      {error && <p role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-800">{error}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Users} iconClass="bg-blue-50 text-blue-600" tag={tag("Usuários")} value={String(activeUsers.length)} label={`${activeUsers.filter((u) => u.accessLevel === "admin").length} administrador(es)`} />
        <MetricCard icon={Building2} iconClass="bg-teal-50 text-teal-600" tag={tag("Clientes")} value={String(companies.data.filter((c) => c.active).length)} label="Empresas ativas" />
        <MetricCard icon={Briefcase} iconClass="bg-violet-50 text-violet-600" tag={tag("Obras")} value={String(projects.data.length)} label={`${projects.data.filter((p) => p.clientCompanyId).length} vinculada(s) a clientes`} />
        <MetricCard
          icon={ShieldAlert}
          iconClass={attention ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}
          tag={tag("Atenção")}
          value={String(attention)}
          label="Contas bloqueadas e obras sem cliente"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[
          { href: "/admin/usuarios", title: "Criar acesso de funcionário", text: "Gera uma senha temporária com troca obrigatória" },
          { href: "/admin/empresas", title: "Cadastrar empresa cliente", text: "Aparece nas sugestões dos formulários" },
          { href: "/admin/obras", title: "Vincular obra a cliente", text: "Cada obra pertence a uma empresa" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-slate-900">{a.title}</div>
              <div className="text-[11.5px] text-slate-500">{a.text}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      <Panel title="Ações recentes" description="Últimos registros da auditoria" action={<Link href="/admin/auditoria" className="text-[12px] font-medium text-slate-600 hover:text-slate-900">Ver tudo</Link>}>
        {logs.loading ? <div className="p-10 text-center text-[13px] text-slate-500">Carregando…</div> : <AuditTable logs={logs.data.slice(0, 8)} />}
      </Panel>
    </AdminShell>
  );
}
