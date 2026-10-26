"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { redirectUserByRole } from "@/app/page";
import type { UserRole } from "@/types";

export default function CompleteProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del form para guardar lo que ponga el usuario
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [ciudadZona, setCiudadZona] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState<"client" | "provider">("client");

  // Para mostrar la fotito antes de subirla de verdad
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí mandamos al usuario a la vista que le toca según si es cliente o prestador
    redirectUserByRole(tipoPerfil as UserRole, router);
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#161615]">
      
     
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

      <div className="relative z-10 w-full max-w-[360px] flex flex-col">
        
        {/* Botón para volver atrás */}
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#D3FC31] text-black shadow-md transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Volver a la creación de cuenta"
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

        <div className="w-full rounded-[26px] sm:rounded-[28px] border border-[#D3FC31] bg-[#0E0E0D] shadow-2xl overflow-hidden">
          
          <div className="pt-5 pb-4 text-center">
            <h1 className="text-[17px] sm:text-lg font-bold text-white tracking-wide">
              Completar perfil
            </h1>
          </div>

          <div className="h-[1px] w-full bg-[#2E2E2E]" />

          <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4">
            
           
            <div className="flex justify-center my-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-[#242423] border border-[#3A3A39] transition-all hover:border-[#D3FC31] cursor-pointer overflow-hidden shadow-inner"
                aria-label="Subir foto de perfil"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <svg
                    className="w-9 h-9 text-[#8A8A8A] transition-colors group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="ciudadZona"
                className="mb-1.5 text-sm font-medium text-white"
              >
                Ciudad / Zona
              </label>
              <input
                id="ciudadZona"
                name="ciudadZona"
                type="text"
                required
                value={ciudadZona}
                onChange={(e) => setCiudadZona(e.target.value)}
                placeholder="Dirección o localidad"
                className="h-[46px] w-full rounded-[12px] bg-[#363636] px-4 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]/60"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="descripcion"
                className="mb-1.5 text-sm font-medium text-white"
              >
                Descripción personal
              </label>
              <div className="relative">
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={2}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Cuéntanos sobre ti..."
                  className="w-full rounded-[12px] bg-[#363636] px-4 py-3 text-sm text-white placeholder:text-[#8A8A8A] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]/60 resize-none"
                />
              </div>
            </div>

            {/* Selector para elegir el rol de la cuenta */}
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-white">
                Tipo de perfil
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoPerfil("client")}
                  className={`flex flex-col justify-start rounded-[14px] p-3.5 text-left transition-all cursor-pointer border ${
                    tipoPerfil === "client"
                      ? "border-[#D3FC31] bg-[#1B1B1B]"
                      : "border-[#2E2E2E] bg-[#121211] hover:border-[#444]"
                  }`}
                >
                  <span className="text-sm font-bold text-white">Cliente</span>
                  <span className="mt-1 text-[11px] leading-tight text-[#8A8A8A]">
                    Busca para adquirir un servicio
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoPerfil("provider")}
                  className={`flex flex-col justify-start rounded-[14px] p-3.5 text-left transition-all cursor-pointer border ${
                    tipoPerfil === "provider"
                      ? "border-[#D3FC31] bg-[#1B1B1B]"
                      : "border-[#2E2E2E] bg-[#121211] hover:border-[#444]"
                  }`}
                >
                  <span className="text-sm font-bold text-white">Prestador</span>
                  <span className="mt-1 text-[11px] leading-tight text-[#8A8A8A]">
                    Ofrece tu tiempo y compañía
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-3 flex h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#D3FC31] text-base font-bold text-black transition-all duration-150 hover:bg-[#cbf127] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3FC31]"
            >
              Finalizar registro
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}