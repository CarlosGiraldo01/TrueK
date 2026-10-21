"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import type { UserRole } from "@/lib/mock/types";

/**
 * ============================================================================
 * UTILIDAD DE NAVEGACIÓN Y GESTIÓN DE ROLES (ARQUITECTURA DE LA APP)
 * ============================================================================
 * 
 * Flujo de bifurcación según el rol del usuario:
 * Esta función es invocada una vez que el usuario completa el inicio de sesión
 * o registro exitosamente desde sus respectivos formularios:
 * - 'provider' -> Redirige al Feed Proveedor (/feed/provider) donde el usuario
 *                 gestiona servicios ofertados y solicitudes entrantes.
 * - 'client'   -> Redirige al Feed Cliente (/feed/client) donde el usuario
 *                 explora experiencias, publicaciones y mapa interactivo.
 *
 * @param role Tipo de rol del usuario ('client' | 'provider')
 * @param router Instancia de enrutador de Next.js
 */
export function redirectUserByRole(
  role: UserRole,
  router: { push: (path: string) => void }
) {
  if (role === "provider") {
    // Feed Proveedor: Panel para administrar servicios y solicitudes entrantes
    router.push("/feed/provider");
  } else {
    // Feed Cliente: Panel para explorar y reservar experiencias
    router.push("/feed/client");
  }
}

export default function WelcomePage() {
  const router = useRouter();

  /**
   * --------------------------------------------------------------------------
   * MANEJADOR: REGISTRARSE
   * --------------------------------------------------------------------------
   * Al hacer clic en "Registrarse", redirige directamente a la pantalla
   * de creación de cuenta (/register).
   */
  const handleRegister = () => {
    router.push("/register");
  };

  /**
   * --------------------------------------------------------------------------
   * MANEJADOR: INICIAR SESIÓN
   * --------------------------------------------------------------------------
   * Al hacer clic en "Iniciar sesión", redirige directamente a la pantalla
   * de inicio de sesión (/login).
   */
  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <main
      className="relative flex flex-1 flex-col justify-between px-6 py-8 sm:px-8 select-none"
      aria-label="Pantalla de bienvenida trueek"
    >
      {/* 
        =======================================================================
        SECCIÓN SUPERIOR / CENTRAL: LOGO Y ESLOGAN
        =======================================================================
        Centrado visual en la mitad superior con fidelidad exacta a la maqueta:
        - Ilustración amarilla/naranja con texto blanco 'truek.'
        - Eslogan centrado en gris claro (#9CA3AF)
      */}
      <div className="flex flex-1 flex-col items-center justify-center text-center -mt-6 sm:-mt-10">
        {/* Logotipo oficial de la marca */}
        <div className="flex items-center justify-center transition-transform hover:scale-105 duration-300">
          <Logo
            variant="vertical"
            height={138}
            className="drop-shadow-sm select-none"
          />
        </div>

        {/* Eslogan oficial */}
        <p className="mt-6 max-w-[280px] text-[15px] sm:text-base font-normal leading-relaxed text-[#9CA3AF] tracking-wide">
          Conecta con personas para vivir<br />nuevas experiencias
        </p>
      </div>

      {/* 
        =======================================================================
        SECCIÓN INFERIOR: BOTONES DE ACCIÓN PRINCIPALES
        =======================================================================
        - Registrarse: Rectángulo redondeado fondo lima (#D3FC31), texto negro negrita
        - Iniciar sesión: Fondo transparente, borde lima, texto lima negrita
      */}
      <div className="w-full flex flex-col gap-3.5 pb-2 sm:pb-4">
        {/* Botón Registrarse (Primario) -> Navega a /register */}
        <button
          type="button"
          onClick={handleRegister}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#D3FC31] px-6 text-base font-bold text-[#161615] shadow-sm transition-all duration-150 hover:bg-[#cbf127] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3FC31] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161615]"
          aria-label="Registrarse en trueek"
        >
          Registrarse
        </button>

        {/* Botón Iniciar sesión (Secundario / Outline) -> Navega a /login */}
        <button
          type="button"
          onClick={handleLogin}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[14px] border-[1.5px] border-[#D3FC31] bg-transparent px-6 text-base font-bold text-[#D3FC31] transition-all duration-150 hover:bg-[#D3FC31]/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3FC31] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161615]"
          aria-label="Iniciar sesión en trueek"
        >
          Iniciar sesión
        </button>
      </div>
    </main>
  );
}