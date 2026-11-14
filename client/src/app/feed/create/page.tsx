"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";
import { NavBar } from "@/components/ui/NavBar";
import { useImageUpload } from "@/hooks/useImageUpload";
import { IMAGE_MIME_TYPES } from "@/lib/uploads";

// Vista para armar y publicar un nuevo truek (rol proveedor)
export default function CreatePostPage() {
  const router = useRouter();
  const { user, activeRole, setActiveRole } = useSession();
  const { addPost, tags } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Asegurarnos de que el usuario esté en modo provider
  useEffect(() => {
    if (activeRole !== "provider") {
      setActiveRole("provider");
    }
  }, [activeRole, setActiveRole]);

  // Datos principales del formulario
  const [formData, setFormData] = useState({
    location: "",
    about: "",
    offer: "",
    price: "",
  });

  // Categorías elegidas (máximo 3)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Subida inmediata de la imagen; el post solo guarda la URL resultante
  const { imageUrl, previewUrl, isUploading, error: imageError, selectFile } = useImageUpload(user?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Manejo de selección/deselección de tags
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0] ?? null);
    // Permite volver a elegir el mismo archivo
    e.target.value = "";
  };

  // Validar y mandar el post al contexto global
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isUploading) {
      setErrorMessage("Espera a que termine de subir la imagen.");
      return;
    }

    if (!formData.location.trim()) {
      setErrorMessage("Por favor ingresa la ciudad y zona.");
      return;
    }
    if (!formData.about.trim()) {
      setErrorMessage("Por favor escribe una descripción sobre ti.");
      return;
    }
    if (!formData.offer.trim()) {
      setErrorMessage("Por favor escribe qué servicio vas a ofrecer.");
      return;
    }
    if (selectedTags.length === 0) {
      setErrorMessage("Selecciona al menos una categoría.");
      return;
    }

    if (!user) {
      setErrorMessage("Debes iniciar sesión para publicar.");
      return;
    }

    // Se aceptan puntos como separador de miles ("50.000")
    const priceNum = Number(formData.price.trim().replace(/\./g, ""));
    if (!Number.isInteger(priceNum) || priceNum < 100 || priceNum > 50000) {
      setErrorMessage("El precio debe estar entre 100 y 50.000.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await addPost({
        user_id: user.id,
        description: formData.about.trim(),
        offer: formData.offer.trim(),
        location: formData.location.trim(),
        tags: selectedTags,
        ...(imageUrl ? { post_image: imageUrl } : {}),
        price: priceNum,
        latitude: 3.4516,
        longitude: -76.532,
      });

      // Redirigir directo al detalle del post recién creado
      router.push("/post/" + created.id + "?created=true");
    } catch (err) {
      const serverMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setErrorMessage(
        typeof serverMessage === "string" && serverMessage
          ? serverMessage
          : "No se pudo crear la publicación. Intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#FF5E1B] selection:text-black">
      
      {/* Barra superior con botón para devolverse */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242423] bg-[#161615] px-4">
        <button
          type="button"
          onClick={() => router.push("/feed/provider")}
          className="-ml-2 flex size-10 items-center justify-center text-white transition-opacity active:opacity-60 cursor-pointer"
          aria-label="Volver"
        >
          <ChevronLeftIcon className="size-5" strokeWidth={2.5} />
        </button>

        <h1 className="text-base font-bold text-white tracking-wide">
          Crear un truek
        </h1>

        <div className="size-10" />
      </header>

      {/* Formulario principal */}
      <main className="flex-1 px-5 py-5 pb-28">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Carga de foto */}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_MIME_TYPES.join(",")}
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#3A3A39] bg-[#1F1F1E] transition-all hover:border-[#FF5E1B] cursor-pointer"
            >
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Vista previa de imagen"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-[#FF5E1B] px-3.5 py-1 text-xs font-bold text-black shadow-md">
                      Cambiar imagen
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#8A8A8A]">
                  <PhotoIcon className="size-10" />
                  <span className="text-xs font-medium text-white/80">
                    Agregar imagen
                  </span>
                </div>
              )}
            </button>
            {isUploading && (
              <p className="text-xs font-medium text-[#8A8A8A]">Subiendo imagen...</p>
            )}
            {imageError && (
              <p role="alert" className="text-xs font-medium text-red-400">{imageError}</p>
            )}
          </div>

          {/* Input Ciudad y zona */}
          <div className="flex flex-col gap-1">
            <label htmlFor="location" className="text-xs font-medium text-[#8A8A8A]">
              Ciudad y zona
            </label>
            <input
              id="location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="¿Dónde ofreces?"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Input Sobre mí */}
          <div className="flex flex-col gap-1">
            <label htmlFor="about" className="text-xs font-medium text-[#8A8A8A]">
              Sobre mí
            </label>
            <input
              id="about"
              type="text"
              required
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="Escribe sobre ti..."
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Textarea Oferta */}
          <div className="flex flex-col gap-1">
            <label htmlFor="offer" className="text-xs font-medium text-[#8A8A8A]">
              ¿Qué vas a ofrecer?
            </label>
            <textarea
              id="offer"
              rows={2}
              required
              value={formData.offer}
              onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
              placeholder="Escribe qué ofreces"
              className="w-full rounded-[12px] bg-[#242423] p-3 text-sm text-white placeholder:text-[#5F5F5F] outline-none resize-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {/* Selección de categorías (tags) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#8A8A8A]">
                Categoría del servicio
              </label>
              <span className="text-[11px] text-[#5F5F5F]">
                Elige hasta 3 categorías
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={
                      "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer " +
                      (isSelected
                        ? "border border-[#FF5E1B] bg-[#FF5E1B] text-black font-bold"
                        : "border border-[#383838] bg-black text-[#9CA3AF] hover:text-white")
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Precio por hora */}
          <div className="flex flex-col gap-1">
            <label htmlFor="price" className="text-xs font-medium text-[#8A8A8A]">
              ¿Cuánto cobrarás por hora?
            </label>
            <input
              id="price"
              type="text"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Mín. 100 - Máx 50.000"
              className="h-11 w-full rounded-[12px] bg-[#242423] px-3.5 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#FF5E1B]"
            />
          </div>

          {errorMessage && (
            <p className="text-xs font-medium text-red-400">{errorMessage}</p>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#FF5E1B] text-base font-bold text-black shadow-lg transition-transform hover:bg-[#fa530f] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Creando..." : "Crear"}
          </button>
        </form>
      </main>

      {/* Menú inferior */}
      <NavBar activeId="inicio" />
    </div>
  );
}