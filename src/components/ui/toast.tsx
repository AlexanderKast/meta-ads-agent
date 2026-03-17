"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-success/10 border-success/30 text-success",
  error: "bg-error/10 border-error/30 text-error",
  info: "bg-info/10 border-info/30 text-info",
};

let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "border rounded-xl px-4 py-3 text-sm animate-[fadeIn_0.2s_ease-in]",
            typeStyles[t.type]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
