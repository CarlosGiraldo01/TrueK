"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { redirectUserByRole } from "@/app/page";
import { useSession } from "@/context/SessionContext";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useSession();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Credenciales enviadas para login:", credentials);
    const roleToRedirect = user?.role ?? "client";
    redirectUserByRole(roleToRedirect, router);
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#161615]">
      
      {/* Siluetas de fondo TrueK */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-12 -left-16 w-80 h-80 opacity-[0.12] rotate-[-20deg]"
      >
        <Image
          src="/brand/logo-icon.png"
          alt=""
          width={320}
          height={320}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 opacity-[0.10] rotate-[15deg]"
      >
        <Image
          src="/brand/logo-icon.png"
          alt=""
          width={320}
          height={320}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -bottom-16 left-8 w-88 h-88 opacity-[0.12] rotate-[25deg]"
      >
        <Image
          src="/brand/logo-icon.png"
          alt=""
          width={350}
          height={350}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Contenedor central: Botón volver + Tarjeta modal */}
      <div className="relative z-10 w-full max-w-[360px] flex flex-col">
        
        {/* Botón Volver circular color naranja con flecha negra */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5E1B] text-black shadow-md transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Volver a la pantalla principal"
        >
          <svg
            className="w-5 h-5 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.8}
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>

        {/* Tarjeta modal: Iniciar sesión */}
        <div className="w-full rounded-[26px] sm:rounded-[28px] border border-[#FF5E1B] bg-[#0E0E0D] shadow-2xl overflow-hidden">
          
          <div className="pt-5 pb-4 text-center">
            <h1 className="text-[17px] sm:text-lg font-bold text-white tracking-wide">
              Iniciar sesión
            </h1>
          </div>

          <div className="h-[1px] w-full bg-[#2E2E2E]" />

          <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4">
            
            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="mb-1.5 text-sm font-medium text-white"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={credentials.email}
                onChange={handleChange}
                placeholder="Correo@ejemplo.com"
                className="h-[46px] w-full rounded-[12px] bg-[#363636] px-4 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]/60"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="mb-1.5 text-sm font-medium text-white"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleChange}
                placeholder="********"
                className="h-[46px] w-full rounded-[12px] bg-[#363636] px-4 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]/60"
              />
            </div>

            <button
              type="submit"
              className="mt-3 flex h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#FF5E1B] text-base font-bold text-black transition-all duration-150 hover:bg-[#f35210] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5E1B]"
            >
              Continuar
            </button>

            <div className="mt-1 text-center">
              <p className="text-[13px] text-[#D1D5DB]">
                ¿No tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="font-bold text-white transition-opacity hover:opacity-80 hover:underline cursor-pointer"
                >
                  Registrate
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}