import React, { ReactNode } from 'react';

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

export const Alert = ({ children, tone, title, className, action }: any) => (
  <div className={`p-4 rounded border bg-blue-50 border-blue-200 text-blue-900 mb-4 flex justify-between items-center ${className || ''}`}>
    <div>
      {title && <strong className="block mb-1">{title}</strong>}
      <div>{children}</div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const Button = ({ children, onClick, disabled, className, tone, type }: any) => (
  <button type={type || "button"} onClick={onClick} disabled={disabled} className={`px-4 py-2 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 disabled:opacity-50 ${className || ''}`}>
    {children}
  </button>
);

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
        <h3 className="font-bold mb-2 text-lg">{title}</h3>
        <p className="mb-4 text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button>
          <Button onClick={onConfirm} className="bg-red-600 text-white hover:bg-red-700">Confirmar</Button>
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

export const useToast = () => {
  return {
    push: (msg: string, type: string) => {
      console.log(`[Toast ${type}]`, msg);
      // if (typeof window !== "undefined") alert(msg);
    },
    show: (msg: string, type: string) => {
      console.log(`[Toast ${type}]`, msg);
      if (typeof window !== "undefined") alert(msg);
    },
    error: (msg: string) => {
      console.error(`[Toast error]`, msg);
      if (typeof window !== "undefined") alert(msg);
    },
    success: (msg: string) => {
      console.log(`[Toast success]`, msg);
      if (typeof window !== "undefined") alert(msg);
    }
  };
};
