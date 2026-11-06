"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { safeNextPath } from "@/shared/security/route-access";
import Image from "next/image";
import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff } from "lucide-react";

import logo from "@/assets/images/logofvelloso.png";

import { useApp } from "@/context/AppContext";
import { DEFAULT_PROFILE, mergeUserProfile, parseStoredUserSession } from "@/modules/users";

export default function LoginPage() {
  const router = useRouter();
  const { setProfile } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Already logged users never see this page: the proxy redirects them using the session cookie.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Preencha o e-mail e a senha corporativa.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "E-mail ou senha inválidos.");
        return;
      }

      if (typeof window !== "undefined") {
        const previousSession = parseStoredUserSession(localStorage.getItem("rdo_user_session"));
        const resolvedAvatar =
          data.profile?.avatarUrl === DEFAULT_PROFILE.avatarUrl &&
          previousSession?.avatarUrl &&
          previousSession.avatarUrl !== DEFAULT_PROFILE.avatarUrl
            ? previousSession.avatarUrl
            : data.profile?.avatarUrl;

        const sessionPayload = {
          ...(data.profile || {}),
          email: data.profile?.email || email,
          name: data.profile?.name || "Alberto Martins",
          role: data.profile?.role || "Encarregado Geral de Obra",
          avatarUrl: resolvedAvatar || data.profile?.avatarUrl || DEFAULT_PROFILE.avatarUrl,
          loggedAt: new Date().toISOString(),
        };

        localStorage.setItem("rdo_user_session", JSON.stringify(sessionPayload));
        setProfile(mergeUserProfile(DEFAULT_PROFILE, sessionPayload));
      } else if (data.profile) {
        setProfile(data.profile);
      }

      // Only internal paths are accepted as "next" (no open redirect).
      const target = safeNextPath(new URLSearchParams(window.location.search).get("next"));
      router.replace(data.profile?.mustChangePassword ? "/alterar-senha" : target);
    } catch {
      setErrorMessage("Não foi possível validar o login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0B1220 0%, #0F1E36 55%, #0B1220 100%)" }}
    >
      {/* Decorative gradient orbs in the FVelloso brand blue */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#1372B9]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#1372B9]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Login card */}
        <div className="bg-white rounded-3xl px-7 pb-7 pt-4 sm:px-9 sm:pb-9 shadow-2xl shadow-black/40">
          {/* Brand */}
          <div className="flex justify-center">
            <Image
              src={logo}
              alt="FVelloso — Consultoria em SMS"
              className="w-40 h-40 object-contain"
              priority
            />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
              Entrar na plataforma
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Gestão de SMS e registro diário de obra.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[12.5px] font-medium flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-[#1372B9] transition-colors pointer-events-none"
                strokeWidth={1.8}
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full h-14 pl-11 pr-4 pt-5 pb-1.5 text-[14px] rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium transition focus:bg-white focus:border-[#1372B9] focus:outline-none focus:ring-4 focus:ring-[#1372B9]/15"
              />
              <label
                htmlFor="email"
                className="absolute left-11 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 pointer-events-none transition-all peer-focus:top-[15px] peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#1372B9] peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold"
              >
                E-mail
              </label>
            </div>

            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-[#1372B9] transition-colors pointer-events-none"
                strokeWidth={1.8}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full h-14 pl-11 pr-12 pt-5 pb-1.5 text-[14px] rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium transition focus:bg-white focus:border-[#1372B9] focus:outline-none focus:ring-4 focus:ring-[#1372B9]/15"
              />
              <label
                htmlFor="password"
                className="absolute left-11 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 pointer-events-none transition-all peer-focus:top-[15px] peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#1372B9] peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold"
              >
                Senha
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.8} />
                ) : (
                  <Eye className="w-[18px] h-[18px]" strokeWidth={1.8} />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 flex items-center justify-center gap-2 px-6 rounded-2xl text-white font-semibold text-[14px] bg-[#1372B9] hover:bg-[#0F5F9C] transition active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-[#1372B9]/25"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Autenticando
                </span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
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
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500 uppercase tracking-wider">
          FVelloso SMS · Consultoria em SMS
        </p>
      </div>
    </div>
  );
}
