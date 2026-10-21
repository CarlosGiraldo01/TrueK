"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/context/SessionContext";
import { NavBar } from "@/components/ui/NavBar";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    age: user?.age ? String(user.age) : "",
    location: user?.location ?? "",
    description: user?.description ?? "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.profile_picture || "/brand/logo-icon.png"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedAge = parseInt(formData.age, 10);

    // Actualizar datos del usuario activo
    updateUser({
      name: formData.name.trim() || user?.name,
      age: isNaN(parsedAge) ? user?.age : parsedAge,
      location: formData.location.trim() || user?.location,
      description: formData.description.trim() || user?.description,
      profile_picture: avatarPreview,
    });

    setTimeout(() => {
      setIsSaving(false);
      // Redirige al perfil donde se muestran los cambios actualizados
      router.push("/profile");
    }, 200);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#FF5E1B] selection:text-black">
      {/* 
        =======================================================================
        ENCABEZADO: '< Editar perfil'
        =======================================================================
      */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242423] bg-[#161615] px-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="-ml-2 flex size-10 items-center justify-center text-white transition-opacity active:opacity-60 cursor-pointer"
          aria-label="Volver"
        >
          <ChevronLeftIcon className="size-5" strokeWidth={2.5} />
        </button>

        <h1 className="text-base font-bold text-white tracking-wide">
          Editar perfil
        </h1>

        <div className="size-10" />
      </header>

      {/* 
        =======================================================================
        FORMULARIO DE EDICIÓN DE PERFIL
        =======================================================================
      */}
      <main className="flex-1 px-5 py-6 pb-28">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar con icono de cámara */}
          <div className="flex justify-center my-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#3A3A39] bg-[#1F1F1E] shadow-xl transition-all hover:border-[#FF5E1B] cursor-pointer"
              aria-label="Cambiar foto de perfil"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarPreview}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-80 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="size-7 text-white" />
              </div>
            </button>
          </div>

          {/* Campo: Nombre */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-xs font-medium text-[#8A8A8A]">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nuevo nombre"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Campo: Edad */}
          <div className="flex flex-col gap-1">
            <label htmlFor="age" className="text-xs font-medium text-[#8A8A8A]">
              Edad
            </label>
            <input
              id="age"
              type="number"
              min={1}
              max={120}
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Ingresa tu edad"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Campo: Ubicación */}
          <div className="flex flex-col gap-1">
            <label htmlFor="location" className="text-xs font-medium text-[#8A8A8A]">
              Ubicación
            </label>
            <input
              id="location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Nueva ubicación"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Campo: Descripción */}
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-xs font-medium text-[#8A8A8A]">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="¿Qué cosas nuevas tienes por contar?"
              className="w-full rounded-[12px] bg-[#242423] p-3 text-sm text-white placeholder:text-[#5F5F5F] outline-none resize-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Botón: Actualizar perfil (Naranja TrueK #FF5E1B) */}
          <button
            type="submit"
            disabled={isSaving}
            className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#FF5E1B] text-base font-bold text-black shadow-lg transition-transform hover:bg-[#fa530f] active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Actualizando..." : "Actualizar perfil"}
          </button>

          {/* Enlace: Cerrar sesión */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </form>
      </main>

      {/* Men? inferior */}
      <NavBar activeId="perfil" />
    </div>
  );
}
