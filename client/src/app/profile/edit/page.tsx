"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeftIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/context/SessionContext";
import { NavBar } from "@/components/ui/NavBar";
import { useImageUpload } from "@/hooks/useImageUpload";
import { IMAGE_MIME_TYPES } from "@/lib/uploads";
import type { UpdateUserInput } from "@/types";

// Vista para editar los datos de perfil del usuario
export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del form con los datos actuales del usuario
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    age: user?.age ? String(user.age) : "",
    location: user?.location ?? "",
    description: user?.description ?? "",
  });

  // Subida inmediata de la foto; el perfil solo guarda la URL resultante
  const { imageUrl, previewUrl, isUploading, error: imageError, selectFile } = useImageUpload(user?.id);
  const avatarSrc = previewUrl ?? user?.profile_picture ?? "/brand/logo-icon.png";

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0] ?? null);
    // Permite volver a elegir el mismo archivo
    e.target.value = "";
  };

  // Guardar cambios y volver al perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isUploading) {
      setErrorMessage("Espera a que termine de subir la imagen.");
      return;
    }
    if (!user) {
      setErrorMessage("Debes iniciar sesión para editar tu perfil.");
      return;
    }

    const name = formData.name.trim();
    const location = formData.location.trim();
    const description = formData.description.trim();
    const age = Number(formData.age);

    if (name.length < 1 || name.length > 60) {
      setErrorMessage("El nombre debe tener entre 1 y 60 caracteres.");
      return;
    }
    if (!Number.isInteger(age) || age < 18 || age > 120) {
      setErrorMessage("La edad debe estar entre 18 y 120.");
      return;
    }
    if (location.length < 1 || location.length > 100) {
      setErrorMessage("La ubicación debe tener entre 1 y 100 caracteres.");
      return;
    }
    if (description.length > 500) {
      setErrorMessage("La descripción no puede superar los 500 caracteres.");
      return;
    }

    // Solo se envían los campos que cambiaron
    const patch: UpdateUserInput = {};
    if (name !== user.name) patch.name = name;
    if (age !== user.age) patch.age = age;
    if (location !== user.location) patch.location = location;
    if (description !== (user.description ?? "")) patch.description = description === "" ? null : description;
    if (imageUrl) patch.profile_picture = imageUrl;

    if (Object.keys(patch).length === 0) {
      router.push("/profile");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(patch);
      router.push("/profile");
    } catch (err) {
      const serverMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setErrorMessage(
        typeof serverMessage === "string" && serverMessage
          ? serverMessage
          : "No se pudo actualizar tu perfil. Intenta de nuevo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Cerrar sesión y mandar al login
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#FF5E1B] selection:text-black">
      
      {/* Header con botón para regresar */}
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

      {/* Formulario principal */}
      <main className="flex-1 px-5 py-6 pb-28">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Foto de perfil */}
          <div className="flex flex-col items-center gap-1.5 my-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_MIME_TYPES.join(",")}
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
                src={avatarSrc}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-80 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="size-7 text-white" />
              </div>
            </button>
            {isUploading && (
              <p className="text-xs font-medium text-[#8A8A8A]">Subiendo imagen...</p>
            )}
            {imageError && (
              <p role="alert" className="text-xs font-medium text-red-400">{imageError}</p>
            )}
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-xs font-medium text-[#8A8A8A]">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={60}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nuevo nombre"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Edad */}
          <div className="flex flex-col gap-1">
            <label htmlFor="age" className="text-xs font-medium text-[#8A8A8A]">
              Edad
            </label>
            <input
              id="age"
              type="number"
              min={18}
              max={120}
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Ingresa tu edad"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Ubicación */}
          <div className="flex flex-col gap-1">
            <label htmlFor="location" className="text-xs font-medium text-[#8A8A8A]">
              Ubicación
            </label>
            <input
              id="location"
              type="text"
              required
              maxLength={100}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Nueva ubicación"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-xs font-medium text-[#8A8A8A]">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              maxLength={500}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="¿Qué cosas nuevas tienes por contar?"
              className="w-full rounded-[12px] bg-[#242423] p-3 text-sm text-white placeholder:text-[#5F5F5F] outline-none resize-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs font-medium text-red-400">{errorMessage}</p>
          )}

          {/* Botón actualizar */}
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#FF5E1B] text-base font-bold text-black shadow-lg transition-transform hover:bg-[#fa530f] active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Actualizando..." : "Actualizar perfil"}
          </button>

          {/* Cerrar sesión */}
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

      <NavBar activeId="perfil" />
    </div>
  );
}