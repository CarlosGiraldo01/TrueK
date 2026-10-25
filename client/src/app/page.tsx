"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import type { UserRole } from "@/types";

// Mandar al usuario al feed que le corresponde según si es proveedor o cliente
export function redirectUserByRole(
  role: UserRole,
  router: { push: (path: string) => void }
) {
  if (role === "provider") {
    router.push("/feed/provider");
  } else {
    router.push("/feed/client");
  }
}

export default function WelcomePage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push("/register");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <main
      className="relative flex flex-1 flex-col justify-between px-6 py-8 sm:px-8 select-none"
      aria-label="Pantalla de bienvenida trueek"
    >
      
      {/* Logo y eslogan en el centro */}
      <div className="flex flex-1 flex-col items-center justify-center text-center -mt-6 sm:-mt-10">
        <div className="flex items-center justify-center transition-transform hover:scale-105 duration-300">
          <Logo
            variant="vertical"
            height={138}
            className="drop-shadow-sm select-none"
          />
        </div>

        <p className="mt-6 max-w-[280px] text-[15px] sm:text-base font-normal leading-relaxed text-[#9CA3AF] tracking-wide">
          Conecta con personas para vivir<br />nuevas experiencias
        </p>
      </div>

      {/* Botones de abajo para entrar o registrarse */}
      <div className="w-full flex flex-col gap-3.5 pb-2 sm:pb-4">
        
        {/* Botón Registrarse */}
        <button
          type="button"
          onClick={handleRegister}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#D3FC31] px-6 text-base font-bold text-[#161615] shadow-sm transition-all duration-150 hover:bg-[#cbf127] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3FC31] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161615]"
          aria-label="Registrarse en trueek"
        >
          Registrarse
        </button>

        {/* Botón Iniciar sesión */}
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