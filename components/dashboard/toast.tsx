"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] right-4 z-50 flex flex-col gap-2 font-dashboard sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-[#059669]/20 bg-[#ECFDF5] text-[#059669]",
  error: "border-[#DC2626]/20 bg-[#FEF2F2] text-[#DC2626]",
  info: "border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)]",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`animate-[dash-page-enter_200ms_ease-out] rounded-[var(--dash-radius)] border px-4 py-3 text-[13px] font-medium shadow-[var(--dash-shadow)] ${VARIANT_STYLES[toast.variant]}`}
    >
      {toast.message}
    </div>
  );
}
