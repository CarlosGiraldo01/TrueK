"use client";

import { Logo } from "@/components/ui/Logo";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { UserRole } from "@/types";

interface FeedHeaderProps {
  role: UserRole;
  onCreatePost?: () => void;
  className?: string;
}

// Cabecera del feed: muestra el logo y el botón de (+) solo si es proveedor
export function FeedHeader({ role, onCreatePost, className = "" }: FeedHeaderProps) {
  const isProvider = role === "provider";

  return (
    <header
      className={`sticky top-0 z-40 w-full select-none bg-[#161615] px-4 py-3.5 border-b border-[#242423] ${className}`}
      aria-label="Barra superior del Feed"
    >
      <div className="flex h-10 items-center justify-between">
        
        {/* Logo de la marca */}
        <div className="flex items-center">
          <Logo variant="horizontal" height={28} className="select-none" />
        </div>

        {/* Botón de crear post (solo para proveedores) */}
        {isProvider ? (
          <button
            type="button"
            onClick={onCreatePost}
            aria-label="Crear nueva publicación o servicio"
            className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-[#D3FC31] text-black shadow-md transition-all duration-150 hover:bg-[#cbf127] hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3FC31] cursor-pointer"
          >
            <PlusIcon className="size-5 stroke-[2.5]" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </header>
  );
}