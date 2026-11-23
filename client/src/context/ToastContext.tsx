"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const TOAST_DURATION_MS = 4000;

// Colores de TrueK: verde lima para lo que salió bien, naranja para los errores.
const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-truek-lime text-truek-black",
  error: "bg-truek-orange text-white",
  info: "bg-truek-surface text-white",
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Mensajes cortos que aparecen abajo unos segundos y se van solos.
// Uso desde cualquier pantalla: const { showToast } = useToast(); showToast("Listo", "success");
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);

    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
    timers.current.add(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Encima de la barra de navegación y del mapa, del mismo ancho que la app */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-1200 mx-auto flex w-full max-w-110 flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg ${TOAST_STYLES[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
