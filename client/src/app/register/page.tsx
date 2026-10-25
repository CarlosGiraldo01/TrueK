"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombreCompleto: "",
    email: "",
    password: "",
    edad: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Subir o bajar la edad con las flechitas de forma sencilla
  const handleStepAge = (increment: number) => {
    const current = Number(formData.edad) || 18;
    const next = current + increment;
    if (next >= 1 && next <= 120) {
      setFormData((prev) => ({ ...prev, edad: String(next) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos de registro:", formData);
    router.push("/complete-profile");
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#161615]">
      
      {/* Logos de fondo */}
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

      {/* Contenedor central */}
      <div className="relative z-10 w-full max-w-[360px] flex flex-col">
        
        {/* Botón para volver */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#D3FC31] text-black shadow-md transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
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

        {/* Tarjeta de registro */}
        <div className="w-full rounded-[26px] sm:rounded-[28px] border border-[#D3FC31] bg-[#0E0E0D] shadow-2xl overflow-hidden">
          
          <div className="pt-5 pb-4 text-center">
            <h1 className="text-[17px] sm:text-lg font-bold text-white tracking-wide">
              Crear cuenta
            </h1>
          </div>

          <div className="h-[1px] w-full bg-[#2E2E2E]" />

          <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4">
            
            {/* Nombre */}
            <div className="flex flex-col">
              <label
                htmlFor="nombreCompleto"
                className="mb-1.5 text-sm font-medium text-white"
              >
                Nombre completo
              </label>
              <input
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                required
                autoComplete="name"
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Nombre y apellido"
                className="h-[46px] w-full rounded-[12px] bg-[#363636] px-4 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]/60"
              />
            </div>

            {/* Email */}
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
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo@ejemplo.com"
                className="h-[46px] w-full rounded-[12px] bg-[#363636] px-4 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]/60"
              />
            </div>

            {/* Contraseña */}
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
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                className="h-[46px] w-full rounded-[12px] bg-[#363636] px-4 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]/60"
              />
            </div>

            {/* Edad con botones para subir/bajar */}
            <div className="flex flex-col">
              <label
                htmlFor="edad"
                className="mb-1.5 text-sm font-medium text-white"
              >
                Edad
              </label>
              <div className="relative flex items-center">
                <input
                  id="edad"
                  name="edad"
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={formData.edad}
                  onChange={handleChange}
                  placeholder="Ingresa tu edad"
                  className="h-[46px] w-full rounded-[12px] bg-[#363636] pl-4 pr-10 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <div className="absolute right-2 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleStepAge(1)}
                    className="flex h-4 w-6 items-center justify-center rounded-[4px] bg-[#2A2A29] text-[#9CA3AF] transition-colors hover:bg-[#D3FC31] hover:text-black active:scale-90 cursor-pointer"
                    aria-label="Aumentar edad"
                  >
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4l-8 8h16l-8-8z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepAge(-1)}
                    className="flex h-4 w-6 items-center justify-center rounded-[4px] bg-[#2A2A29] text-[#9CA3AF] transition-colors hover:bg-[#D3FC31] hover:text-black active:scale-90 cursor-pointer"
                    aria-label="Disminuir edad"
                  >
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 20l8-8H4l8 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className="mt-3 flex h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#D3FC31] text-base font-bold text-black transition-all duration-150 hover:bg-[#cbf127] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3FC31]"
            >
              Continuar
            </button>

            {/* Enlace al login */}
            <div className="mt-1 text-center">
              <p className="text-[13px] text-[#D1D5DB]">
                ¿Tienes ya una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-bold text-white transition-opacity hover:opacity-80 hover:underline cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}