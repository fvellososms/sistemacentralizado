"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  Camera,
  CheckCircle2,
  LogOut,
  Save,
  Maximize2,
  X,
  KeyRound,
  Briefcase,
} from "lucide-react";

const DEFAULT_AVATAR_URL =
  "https://images.pexels.com/photos/8960995/pexels-photo-8960995.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800";

export default function PerfilPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useApp();

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCpf(profile.cpf || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setBirthDate(profile.birthDate || "");
      setAddress(profile.address || "");
      setDepartment(profile.department || "Engenharia & Produção");
      setAvatarUrl(profile.avatarUrl || DEFAULT_AVATAR_URL);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!name.trim()) {
      setFeedbackMessage({ type: "error", text: "Nome Completo é obrigatório." });
      return;
    }
    if (!email.trim()) {
      setFeedbackMessage({ type: "error", text: "E-mail é obrigatório." });
      return;
    }
    if (!department.trim()) {
      setFeedbackMessage({ type: "error", text: "Departamento é obrigatório." });
      return;
    }

    if (showPasswordChange && newPassword) {
      if (newPassword.length < 6) {
        setFeedbackMessage({ type: "error", text: "A nova senha deve ter no mínimo 6 caracteres." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedbackMessage({ type: "error", text: "A confirmação da nova senha não confere." });
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cpf,
          email,
          phone,
          birthDate,
          address,
          department,
          avatarUrl,
          newPassword: showPasswordChange ? newPassword : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      setFeedbackMessage({ type: "success", text: "Perfil atualizado com sucesso." });
      setShowPasswordChange(false);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      await refreshProfile();
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Erro ao atualizar perfil." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rdo_user_session");
      router.push("/login");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 tracking-tight">
            Meu Perfil
          </h1>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Gerencie suas credenciais e dados funcionais.
          </p>
        </div>

        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-xl text-[12.5px] font-medium flex items-center gap-2.5 border ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                : "bg-red-50 text-red-800 border-red-100"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/80 text-center">
          <div className="relative inline-block group">
            <button
              type="button"
              onClick={() => setIsAvatarExpanded(true)}
              className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-slate-100 hover:ring-slate-200 transition"
            >
              <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                <Maximize2 className="w-6 h-6" />
              </div>
            </button>
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-md transition active:scale-95">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <h2 className="text-[17px] font-semibold text-slate-900 mt-4 tracking-tight">
            {name || "Alberto Martins"}
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>{email}</span>
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/80 space-y-5"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-semibold text-slate-900">Dados Pessoais</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Mantenha seus dados atualizados para os cabeçalhos de RDO.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-semibold text-slate-700">
                  E-mail Corporativo *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
                >
                  <KeyRound className="w-6 h-6" />
                  <span>{showPasswordChange ? "Cancelar" : "Alterar senha"}</span>
                </button>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                Celular
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                Departamento *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                Endereço Residencial
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade - UF"
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 font-medium transition"
              />
            </div>
          </div>

          {showPasswordChange && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-900">
                <Lock className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>Alteração de senha</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="password"
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300"
                />
                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-8 py-4 rounded-xl text-[14.5px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition self-start"
            >
              <LogOut className="w-6 h-6" strokeWidth={1.8} />
              <span>Sair da conta</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 px-7 py-4.5 rounded-xl text-[14.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              <Save className="w-6 h-6" strokeWidth={1.8} />
              <span>{isSaving ? "Salvando..." : "Salvar alterações"}</span>
            </button>
          </div>
        </form>
      </div>

      {isAvatarExpanded && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAvatarExpanded(false)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-2xl text-center">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full aspect-square object-cover rounded-xl"
            />
            <h3 className="font-semibold text-[15px] text-slate-900 mt-3">{name}</h3>
            <p className="text-[12px] text-slate-500">{department}</p>
            <button
              onClick={() => setIsAvatarExpanded(false)}
              className="mt-3 px-4 py-1.5 rounded-full text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
