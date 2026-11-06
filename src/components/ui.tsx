"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type Tone = "info" | "success" | "warning" | "danger" | "neutral";

export const Badge = ({ children, tone, title, ...props }: any) => (
  <span className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs" title={title} {...props}>{children}</span>
);

export const Spinner = () => <span>Loading...</span>;

export const EmptyState = ({ icon, title, description, action }: any) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="text-slate-500 mt-1 mb-4">{description}</p>
    {action}
  </div>
);

const ALERT_TONE: Record<Tone, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  danger: "bg-red-50 border-red-200 text-red-900",
  neutral: "bg-slate-50 border-slate-200 text-slate-800",
};

export const Alert = ({ children, tone, title, className, action }: any) => (
  <div role={tone === "danger" || tone === "warning" ? "alert" : undefined} className={`p-4 rounded-xl border text-[13px] mb-4 flex justify-between items-center gap-3 ${ALERT_TONE[tone as Tone] ?? ALERT_TONE.info} ${className || ''}`}>
    <div>
      {title && <strong className="block mb-1">{title}</strong>}
      <div>{children}</div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

// Same look as the RDO modal buttons, so every popup shares one button style.
const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
};

const BUTTON_SIZE = {
  sm: "px-3 py-1.5 text-[12.5px]",
  md: "px-4 py-2.5 text-[13px]",
};

export const Button = ({
  children,
  onClick,
  disabled,
  className,
  type,
  variant = "primary",
  size = "md",
  loading,
  ...rest
}: any) => (
  <button
    type={type || "button"}
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${BUTTON_SIZE[size as keyof typeof BUTTON_SIZE] ?? BUTTON_SIZE.md} ${BUTTON_VARIANT[variant as ButtonVariant] ?? BUTTON_VARIANT.primary} ${className || ''}`}
    {...rest}
  >
    {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />}
    {children}
  </button>
);

type ConfirmTone = "primary" | "success" | "danger";

/**
 * Confirmation dialog used by the APR screens (open/description/confirmLabel/tone/loading/onCancel,
 * optional extra content as children). The older isOpen/message/onClose props are still accepted.
 */
export const ConfirmDialog = ({
  open,
  isOpen,
  title,
  description,
  message,
  confirmLabel = "Confirmar",
  tone = "primary",
  loading,
  onConfirm,
  onCancel,
  onClose,
  children,
}: {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  description?: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  children?: ReactNode;
}) => {
  if (!(open ?? isOpen)) return null;
  const cancel = onCancel ?? onClose ?? (() => undefined);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !loading && cancel()} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6">
        <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">{title}</h3>
        {(description ?? message) && <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{description ?? message}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={cancel} disabled={loading}>Cancelar</Button>
          <Button variant={tone} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

export const Input = ({
  value,
  onChange,
  label,
  error,
  required,
  className,
  placeholder,
  readOnly,
  type,
  disabled,
  help,
}: {
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
  disabled?: boolean;
  help?: string;
  [key: string]: any;
}) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium mb-1 text-slate-700">{label} {required && '*'}</label>}
    <input type={type || "text"} readOnly={readOnly} disabled={disabled} className={`border rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none ${error ? 'border-red-500' : 'border-slate-300'}`} value={value} onChange={onChange} placeholder={placeholder} />
    {help && <span className="text-slate-500 text-xs mt-1 block">{help}</span>}
    {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
  </div>
);

export const Select = ({
  value,
  onChange,
  label,
  children,
  required,
  className,
  error,
}: {
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  label?: string;
  children?: ReactNode;
  required?: boolean;
  className?: string;
  error?: string;
  [key: string]: any;
}) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium mb-1 text-slate-700">{label} {required && '*'}</label>}
    <select className={`border rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none ${error ? 'border-red-500' : 'border-slate-300'}`} value={value} onChange={onChange}>
      {children}
    </select>
    {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
  </div>
);

export const Textarea = ({
  value,
  onChange,
  label,
  rows,
  help,
  className,
  required,
  error,
  placeholder,
}: {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  label?: string;
  rows?: number;
  help?: string;
  className?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  [key: string]: any;
}) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium mb-1 text-slate-700">{label} {required && '*'}</label>}
    <textarea className={`border rounded p-2 w-full focus:ring-2 focus:ring-slate-900 focus:outline-none ${error ? 'border-red-500' : 'border-slate-300'}`} value={value} onChange={onChange} rows={rows || 3} placeholder={placeholder}></textarea>
    {help && <span className="text-slate-500 text-xs mt-1 block">{help}</span>}
    {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
  </div>
);

export interface SiteToastEventDetail {
  id?: number;
  message: string;
  tone: Tone;
}

const SITE_TOAST_EVENT = "fv-site-toast";

export function extractErrorMessage(err: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err.trim() || fallback;
  if (err instanceof Error && err.message?.trim()) return err.message.trim();
  if (typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return ((err as any).message as string).trim() || fallback;
  }
  return fallback;
}

export function notifySite(message: string, tone: Tone = "danger"): void {
  if (typeof window === "undefined") return;
  const cleanMessage = (message || "").trim();
  if (!cleanMessage) return;
  window.dispatchEvent(
    new CustomEvent<SiteToastEventDetail>(SITE_TOAST_EVENT, {
      detail: { id: Date.now() + Math.random(), message: cleanMessage, tone },
    })
  );
}

function mapToastTypeToTone(type?: string): Tone {
  if (type === "error" || type === "danger") return "danger";
  if (type === "success") return "success";
  if (type === "warning" || type === "warn") return "warning";
  return "info";
}

export const useToast = () => {
  return {
    push: (msg: string, type = "info") => {
      notifySite(msg, mapToastTypeToTone(type));
    },
    show: (msg: string, type = "info") => {
      notifySite(msg, mapToastTypeToTone(type));
    },
    error: (msg: string) => {
      notifySite(msg, "danger");
    },
    success: (msg: string) => {
      notifySite(msg, "success");
    },
  };
};

interface ActiveToast {
  id: number;
  message: string;
  tone: Tone;
}

export function GlobalToastViewport() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const addToast = (message: string, tone: Tone = "danger") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => {
        // Avoid duplicate identical messages already on screen
        if (prev.some((t) => t.message === message && t.tone === tone)) return prev;
        return [...prev.slice(-4), { id, message, tone }];
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6500);
    };

    const handleCustomToast = (event: Event) => {
      const custom = event as CustomEvent<SiteToastEventDetail>;
      if (custom.detail?.message) {
        addToast(custom.detail.message, custom.detail.tone || "info");
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = extractErrorMessage(event.reason, "Falha inesperada na operação.");
      addToast(msg, "danger");
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop")) return;
      const msg = extractErrorMessage(event.error ?? event.message, "Erro inesperado na aplicação.");
      addToast(msg, "danger");
    };

    window.addEventListener(SITE_TOAST_EVENT, handleCustomToast);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener(SITE_TOAST_EVENT, handleCustomToast);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((t) => {
        const isDanger = t.tone === "danger";
        const isSuccess = t.tone === "success";
        const isWarning = t.tone === "warning";

        const Icon = isDanger
          ? AlertCircle
          : isSuccess
            ? CheckCircle2
            : isWarning
              ? AlertTriangle
              : Info;

        const containerClass = isDanger
          ? "bg-red-50/95 border-red-200 text-red-900 shadow-red-900/10"
          : isSuccess
            ? "bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-900/10"
            : isWarning
              ? "bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-900/10"
              : "bg-slate-900/95 border-slate-700 text-white shadow-slate-900/20";

        const iconClass = isDanger
          ? "text-red-600"
          : isSuccess
            ? "text-emerald-600"
            : isWarning
              ? "text-amber-600"
              : "text-blue-400";

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${containerClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} strokeWidth={2} />
            <div className="flex-1 min-w-0 text-[13px] font-medium leading-snug break-words">
              {t.message}
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              aria-label="Fechar aviso"
              className="p-1 -mr-1 -mt-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
