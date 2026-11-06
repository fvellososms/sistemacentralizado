"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, LogOut, ShieldAlert } from "lucide-react";
import logo from "@/assets/images/logofvelloso.png";
import { useApp } from "@/context/AppContext";
import { PASSWORD_MIN_LENGTH, validatePasswordStrength } from "@/modules/users";
import { logout } from "@/components/auth/logout";

const inputClass =
  "w-full h-12 px-4 text-[14px] rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium transition focus:bg-white focus:border-[#1372B9] focus:outline-none focus:ring-4 focus:ring-[#1372B9]/15";

/** Shown after login with a temporary password (or after an admin reset); the proxy keeps the user here. */
export default function AlterarSenhaPage() {
  const router = useRouter();
  const { profile, setProfile } = useApp();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const weak = validatePasswordStrength(newPassword, profile?.email);
    if (weak) return setError(weak);
    if (newPassword !== confirmPassword) return setError("A confirmação da nova senha não confere.");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível alterar a senha.");
      if (data.profile) setProfile(data.profile);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: "linear-gradient(160deg, #0B1220 0%, #0F1E36 55%, #0B1220 100%)" }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl px-7 pb-7 pt-4 sm:px-9 sm:pb-9 shadow-2xl shadow-black/40">
        <div className="flex justify-center">
          <Image src={logo} alt="FVelloso — Consultoria em SMS" className="w-28 h-28 object-contain" priority />
        </div>
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 w-11 h-11 rounded-2xl bg-[#1372B9]/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#1372B9]" />
          </div>
          <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Defina a sua senha</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Você entrou com uma senha temporária. Crie uma senha pessoal para continuar.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[12.5px] font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">Senha temporária</span>
            <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">Nova senha</span>
            <input type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">Confirmar nova senha</span>
            <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </label>
          <p className="text-[11.5px] text-slate-500">
            Mínimo de {PASSWORD_MIN_LENGTH} caracteres, com letras e números, sem conter o seu e-mail.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 mt-1 rounded-2xl text-white font-semibold text-[14px] bg-[#1372B9] hover:bg-[#0F5F9C] transition disabled:opacity-60 shadow-lg shadow-[#1372B9]/25"
          >
            {saving ? "Salvando…" : "Salvar e continuar"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => void logout(router)}
          className="w-full mt-3 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </div>
  );
}
