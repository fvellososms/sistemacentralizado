import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { AprWizard } from "@/components/apr/AprWizard";
import { carregarApr } from "@/lib/apr/repo";
import { getUsuarioAtual } from "@/db/session";

export const dynamic = "force-dynamic";

export default async function EditarAprPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [a, usuario] = await Promise.all([carregarApr(Number(id)), getUsuarioAtual()]);
  if (!a) notFound();
  if (a.status === "aprovada" || a.status === "aguardando_aprovacao") redirect(`/apr/${a.id}`);

  const obraNome = a.obraCodigo ? `${a.obraCodigo} · ${a.obraNome}` : a.obraNome;
  return (
    <AppLayout>
      
      <div className="mb-6">
        <div className="text-sm text-slate-500 mb-2">
          <Link href="/apr" className="hover:underline">APR</Link> / <Link href={`/apr/${a.id}`} className="hover:underline">{a.codigo}</Link> / Editar
        </div>
        <h1 className="text-2xl font-bold">Editar {a.codigo}</h1>
        <p className="text-slate-600 mt-1">Continue a elaboração de onde parou.</p>
      </div>

      <AprWizard inicial={a} obraNome={obraNome} usuarioNome={usuario.nome} />
    </AppLayout>
  );
}
