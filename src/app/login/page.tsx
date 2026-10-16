"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2, Hexagon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("carlos.silva@construtora.com.br");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Preencha o e-mail e a senha corporativa.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "rdo_user_session",
          JSON.stringify({
            email,
            name: "Alberto Martins",
            role: "Encarregado Geral de Obra",
            loggedAt: new Date().toISOString(),
          })
        );
      }
      router.push("/dashboard");
    }, 450);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail("");
    }, 2500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ background: "#0B0F1A" }}
    >
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand mark above card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Hexagon className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white text-[15px] tracking-tight">
                RDO Construtora
              </div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Gestão de Canteiro
              </div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/40 border border-slate-100">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
              Entrar na plataforma
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Acesse o painel de registro diário de obra.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[12.5px] font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@construtora.com.br"
                  className="w-full pl-10 pr-3.5 py-2.5 text-[13.5px] rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 text-slate-900 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-[13.5px] rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 text-slate-900 font-medium transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(true);
                  setForgotEmail(email);
                }}
                className="text-[12.5px] font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-4.5 px-8 rounded-xl text-white font-medium text-[15.5px] bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-60 shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Autenticando
                </span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-6 h-6" strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Acesso restrito a engenheiros, encarregados e gestores autorizados.
              <br />
              <span className="font-medium text-slate-700">
                Contas gerenciadas pela Diretoria de Engenharia.
              </span>
            </p>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] font-medium text-slate-500 mb-0.5">
              Credenciais demo
            </p>
            <code className="text-[11px] text-slate-700 font-mono font-medium">
              carlos.silva@construtora.com.br / 123456
            </code>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 animate-in fade-in">
            <h3 className="text-[17px] font-semibold text-slate-900 tracking-tight">
              Recuperar senha
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-1.5 leading-relaxed">
              Informe seu e-mail corporativo. Você receberá um link para redefinir o acesso.
            </p>

            {forgotSuccess ? (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-[12.5px] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instruções enviadas para {forgotEmail}!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@construtora.com.br"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-4 rounded-xl text-[14.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition"
                  >
                    Enviar link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
