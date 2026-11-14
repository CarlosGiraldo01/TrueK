import type { ReactNode } from "react";
import { cn } from "./cn";

type StatusVariant = "loading" | "empty" | "error";
type StatusSize = "md" | "sm";

interface StatusMessageProps {
  variant?: StatusVariant;
  size?: StatusSize;
  className?: string;
  children: ReactNode;
}

const TEXT_SIZE: Record<StatusSize, string> = {
  md: "text-sm",
  sm: "text-xs",
};

// Mensajes de estado (cargando, vacío, error) con un mismo tratamiento en todo el cliente.
// size="sm" es para textos secundarios dentro de una tarjeta: sin adornos, para no competir con ella.
export const StatusMessage = ({ variant = "empty", size = "md", className, children }: StatusMessageProps) => {
  const isSmall = size === "sm";
  const isError = variant === "error";
  const showDot = variant === "loading" && !isSmall;
  const showBar = variant === "empty" && !isSmall;

  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-center justify-center gap-2 text-center font-semibold",
        showBar && "flex-col",
        TEXT_SIZE[size],
        isError ? "text-truek-orange" : isSmall ? "text-white/80" : "text-white",
        className,
      )}
    >
      {showDot && <span aria-hidden="true" className="size-2 shrink-0 animate-pulse rounded-full bg-truek-lime" />}
      {showBar && <span aria-hidden="true" className="h-1 w-6 rounded-full bg-truek-lime" />}
      <span>{children}</span>
    </p>
  );
};
