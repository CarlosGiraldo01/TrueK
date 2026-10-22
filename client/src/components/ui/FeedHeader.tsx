"use client";

import { Logo } from "@/components/ui/Logo";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { UserRole } from "@/types";

interface FeedHeaderProps {
  /**
   * Rol activo del usuario ('provider' o 'client').
   * Determina la visibilidad de los controles de publicación.
   */
  role: UserRole;
  /**
   * Callback invocado al hacer clic en el botón de crear publicación.
   */
  onCreatePost?: () => void;
  /**
   * Clases opcionales adicionales para el encabezado.
   */
  className?: string;
}

/**
 * ============================================================================
 * COMPONENTE FEEDHEADER - BARRA SUPERIOR CON CONTROL DE VISIBILIDAD POR ROL
 * ============================================================================
 * 
 * Reglas de visibilidad implementadas:
 * 1. Rol Proveedor ('provider'):
 *    - Se renderiza el botón flotante / superior con ícono (+) en la esquina derecha.
 *    - Permite al proveedor acceder a la creación de publicaciones o servicios.
 * 
 * 2. Rol Cliente ('client'):
 *    - El botón (+) se excluye completamente del árbol del DOM (renderizado condicional null).
 *    - La barra queda completamente limpia, mostrando únicamente el logotipo oficial 'truek.'.
 *    - El cliente no dispone de ningún acceso visual ni funcional para publicar.
 */
export function FeedHeader({ role, onCreatePost, className = "" }: FeedHeaderProps) {
  const isProvider = role === "provider";

  return (
    <header
      className={`sticky top-0 z-40 w-full select-none bg-[#161615] px-4 py-3.5 border-b border-[#242423] ${className}`}
      aria-label="Barra superior del Feed"
    >
      <div className="flex h-10 items-center justify-between">
        {/* Logotipo de la marca en la esquina superior izquierda */}
        <div className="flex items-center">
          <Logo variant="horizontal" height={28} className="select-none" />
        </div>

        {/* 
          Control condicional estricto por rol:
          Sólo los proveedores visualizan y pueden accionar el botón de creación (+)
        */}
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
