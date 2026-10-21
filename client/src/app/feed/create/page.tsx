"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { TAGS, POSTS, type Post } from "@/lib/mock";
import { NavBar } from "@/components/ui/NavBar";

export default function CreatePostPage() {
  const router = useRouter();
  const { user, activeRole } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================================================
  // RESTRICCIÓN DE ACCESO FUNCIONAL:
  // El cliente no debe tener ninguna ruta de acceso visual o funcional para
  // publicar servicios dentro de esta sección.
  // ==========================================================================
  useEffect(() => {
    if (activeRole !== "provider") {
      // Bloquear acceso al cliente y redirigir inmediatamente al feed cliente
      router.replace("/feed/client");
    }
  }, [activeRole, router]);

  const [formData, setFormData] = useState({
    name: user?.name ?? "Valentina Arias",
    title: "",
    description: "",
    location: user?.location ?? "Cali, Granada",
    price: "35000",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Conversar",
    "Escucha activa",
  ]);
  const [imagePreview, setImagePreview] = useState<string>("/mock/valentina.png");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newPost: Post = {
      id: `p_${Date.now()}`,
      user_id: user?.id ?? "u2",
      name: formData.name || (user?.name ?? "Valentina Arias"),
      description: formData.description,
      tags: selectedTags.length > 0 ? selectedTags : ["Conversar"],
      location: formData.location,
      latitude: 3.4516,
      longitude: -76.532,
      post_image: imagePreview,
      created_at: new Date().toISOString(),
    };

    // Agregar la publicación al listado simulado
    POSTS.unshift(newPost);

    setTimeout(() => {
      setIsSubmitting(false);
      // Redirigir al feed del proveedor para ver su nueva publicación
      router.push("/feed/provider");
    }, 400);
  };

  if (activeRole !== "provider") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#161615] p-6 text-center text-white">
        <p className="text-sm text-[#8A8A8A]">
          Acceso restringido. Redirigiendo al feed cliente...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      {/* 
        =======================================================================
        BARRA SUPERIOR CON BOTÓN VOLVER Y TÍTULO
        =======================================================================
      */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242423] bg-[#161615] px-4">
        <button
          type="button"
          onClick={() => router.push("/feed/provider")}
          className="flex size-9 items-center justify-center rounded-full bg-[#D3FC31] text-black shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Volver al Feed"
        >
          <svg className="size-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        <h1 className="text-base font-bold text-white tracking-wide">
          Nueva publicación
        </h1>

        <div className="size-9" />
      </header>

      {/* 
        =======================================================================
        FORMULARIO DE PUBLICACIÓN DE SERVICIOS
        =======================================================================
      */}
      <main className="flex-1 px-4 py-5 pb-28">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Subir foto de la experiencia */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">
              Foto de la experiencia
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex aspect-5/4 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#3A3A39] bg-[#1B1B1B] transition-colors hover:border-[#D3FC31]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Vista previa"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-[#D3FC31] px-4 py-1.5 text-xs font-bold text-black shadow-md">
                  Cambiar foto
                </span>
              </div>
            </div>
          </div>

          {/* Nombre visible en la tarjeta */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-white">
              Tu nombre o alias
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 w-full rounded-[14px] bg-[#242423] px-4 text-sm text-white outline-none focus:ring-1.5 focus:ring-[#D3FC31]"
              placeholder="Ej: Valentina Arias"
            />
          </div>

          {/* Descripción del servicio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-white">
              ¿Qué te gustaría ofrecer o hacer?
            </label>
            <textarea
              id="description"
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-[14px] bg-[#242423] p-4 text-sm text-white outline-none resize-none focus:ring-1.5 focus:ring-[#D3FC31]"
              placeholder="Ej: Me gusta salir a comer, conversar y jugar bolos..."
            />
          </div>

          {/* Etiquetas / Categorías */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">
              Etiquetas del servicio
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border border-[#D3FC31] bg-[#D3FC31] text-black font-bold"
                        : "border border-[#383838] bg-black text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ubicación */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className="text-sm font-medium text-white">
              Ubicación o zona
            </label>
            <input
              id="location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="h-12 w-full rounded-[14px] bg-[#242423] px-4 text-sm text-white outline-none focus:ring-1.5 focus:ring-[#D3FC31]"
              placeholder="Ej: Cali, ciudad pacifica"
            />
          </div>

          {/* Botón de Publicar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#D3FC31] text-base font-bold text-black shadow-lg transition-transform hover:bg-[#cbf127] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Publicando..." : "Publicar servicio"}
          </button>
        </form>
      </main>

      {/* Menú inferior */}
      <NavBar activeId="inicio" />
    </div>
  );
}
