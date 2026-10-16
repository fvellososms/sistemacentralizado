"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, ConfirmDialog, Textarea, useToast } from "@/components/ui";
import type { AprStatus, Perfil } from "@/lib/apr/types";

export function AprAcoes({
  aprId,
  status,
  perfil,
  usuarioId,
  autorId,
  usuarioNome,
}: {
  aprId: number;
  status: AprStatus;
  perfil: Perfil;
  usuarioId: number;
  autorId: number | null;
  usuarioNome: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [dialogo, setDialogo] = useState<"aprovar" | "reprovar" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState<string | undefined>();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ehAutor = autorId === null || autorId === usuarioId || perfil === "admin_sst";
  const podeAprovar = perfil === "aprovador" && status === "aguardando_aprovacao";

  async function executar(acao: "aprovar" | "reprovar") {
    if (acao === "reprovar" && !motivo.trim()) {
      setErroMotivo("Informe o motivo da reprovação para orientar a correção.");
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/apr/${aprId}/acao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, motivo }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Falha ao executar ação.");
      toast.push(acao === "aprovar" ? "APR aprovada. Registro imutável gerado." : "APR devolvida ao elaborador.", acao === "aprovar" ? "success" : "warning");
      setDialogo(null);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de comunicação.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <Alert tone="danger" title="Falha de comunicação" action={<Button size="sm" variant="secondary" onClick={() => setErro(null)}>Fechar</Button>}>
          {erro}
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {(status === "rascunho" || status === "reprovada") && ehAutor && (
          <Link href={`/apr/${aprId}/editar`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition">
            {status === "reprovada" ? "Corrigir e reenviar" : "Continuar elaboração"}
          </Link>
        )}
        {podeAprovar && (
          <>
            <Button variant="success" onClick={() => setDialogo("aprovar")}>
              Aprovar APR
            </Button>
            <Button variant="danger" onClick={() => setDialogo("reprovar")}>
              Reprovar / devolver
            </Button>
          </>
        )}
        {status === "aguardando_aprovacao" && perfil !== "aprovador" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-100">Aguardando análise do aprovador</span>
        )}
        <Link href="/apr" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
          Voltar à lista
        </Link>
      </div>

      <ConfirmDialog
        open={dialogo === "aprovar"}
        title="Aprovar esta APR?"
        description={`A aprovação será registrada em nome de ${usuarioNome} e gerará um registro imutável. Alterações posteriores na base de conhecimento não afetarão esta APR.`}
        confirmLabel="Confirmar aprovação"
        tone="success"
        loading={carregando}
        onCancel={() => setDialogo(null)}
        onConfirm={() => void executar("aprovar")}
      />
      <ConfirmDialog
        open={dialogo === "reprovar"}
        title="Reprovar e devolver a APR?"
        description="A APR retornará ao elaborador para correção. Informe o motivo de forma objetiva."
        confirmLabel="Reprovar e devolver"
        tone="danger"
        loading={carregando}
        onCancel={() => {
          setDialogo(null);
          setErroMotivo(undefined);
        }}
        onConfirm={() => void executar("reprovar")}
      >
        <Textarea
          label="Motivo da reprovação"
          required
          rows={3}
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setErroMotivo(undefined);
          }}
          error={erroMotivo}
          placeholder="Ex.: falta linha de vida para o trabalho em altura na face norte."
        />
      </ConfirmDialog>
    </div>
  );
}
