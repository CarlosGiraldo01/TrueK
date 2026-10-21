"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";
import { TAGS } from "@/lib/mock";
import { NavBar } from "@/components/ui/NavBar";

/**
 * Componente de la pantalla 'Crear un truek'.
 * 
 * Permite a los usuarios con rol de proveedor publicar nuevas ofertas de truek o servicios.
 * Recolecta la fotografía de la experiencia, ciudad y zona, biografía corta ('Sobre mí'),
 * detalle de la oferta ('¿Qué vas a ofrecer?'), hasta 3 categorías temáticas y tarifa por hora.
 * 
 * Al completarse el guardado, añade el nuevo post al contexto global y redirige de inmediato
 * a la pantalla de detalle de la publicación recién creada para visualizar exactamente los
 * datos escritos por el usuario.
 */
export default function CreatePostPage() {
  const router = useRouter();
  const { user, activeRole, setActiveRole } = useSession();
  const { addPost } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Efecto de sincronización de rol:
   * Garantiza que el usuario activo se encuentre en modo 'provider' al estar en esta pantalla,
   * permitiendo el flujo continuo de publicación sin bloqueos inesperados.
   */
  useEffect(() => {
    if (activeRole !== "provider") {
      setActiveRole("provider");
    }
  }, [activeRole, setActiveRole]);

  /**
   * Estado de los campos de texto del formulario:
   * Inician limpios para que la publicación resultante muestre estrictamente lo escrito.
   */
  const [formData, setFormData] = useState({
    location: "",
    about: "",
    offer: "",
    price: "",
  });

  /**
   * Lista de categorías temáticas seleccionadas por el usuario (máximo 3 etiquetas).
   */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  /**
   * Imagen en formato Data URL (Base64) lista para almacenar de forma persistente.
   */
  const [imagePreview, setImagePreview] = useState<string>("");

  /**
   * Indicador de carga mientras se procesa y persiste la nueva publicación.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Mensaje informativo en caso de validaciones insatisfechas en el formulario.
   */
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Alterna la selección de una etiqueta de categoría:
   * - Si ya está seleccionada, la remueve de la lista.
   * - Si no está seleccionada, valida que no se supere el límite de 3 categorías.
   * 
   * @param tag - Nombre de la categoría a seleccionar o deseleccionar.
   */
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

  /**
   * Manejador de selección de imagen local:
   * Convierte el archivo seleccionado por el usuario a una cadena Base64 mediante FileReader.
   * Esto garantiza que la imagen persista en localStorage y no expire al navegar o recargar.
   * 
   * @param e - Evento de cambio del input de tipo file.
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Manejador de envío del formulario de creación:
   * 1. Valida que todos los campos obligatorios hayan sido diligenciados.
   * 2. Limpia y procesa el valor numérico de la tarifa por hora.
   * 3. Crea la publicación asociada al proveedor actual con la información exacta ingresada.
   * 4. Guarda la publicación en el contexto y almacenamiento local.
   * 5. Redirige directamente al detalle de la publicación recién creada (/post/[id]?created=true).
   * 
   * @param e - Evento de envío del formulario.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validación de campos obligatorios
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

    setIsSubmitting(true);

    // Procesamiento del precio numérico ingresado
    const cleanPrice = formData.price.trim();
    const priceNum = Number(cleanPrice.replace(/\D/g, "")) || 5000;
    const authorId = user?.id ?? "u2";
    const authorName = user?.name ?? "Valentina Arias";
    const authorAge = user?.age ? (user.age + " años") : "24 años";

    // Registro de la nueva publicación con la información ingresada por el usuario
    const newPost = addPost({
      user_id: authorId,
      name: authorName,
      description: formData.about.trim(),
      offer: formData.offer.trim(),
      tags: selectedTags,
      location: formData.location.trim(),
      latitude: 3.4516,
      longitude: -76.532,
      post_image: imagePreview || "/mock/valentina.png",
      price: priceNum,
      age: authorAge,
      rating: 4.7,
      published_ago: "Publicado hace un momento",
    });

    setIsSubmitting(false);

    // Redirección inmediata a la vista detallada de la publicación recién creada
    router.push("/post/" + newPost.id + "?created=true");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#FF5E1B] selection:text-black">
      {/* 
        =======================================================================
        BARRA SUPERIOR CON BOTÓN VOLVER Y TÍTULO: '< Crear un truek'
        =======================================================================
      */}
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

      {/* 
        =======================================================================
        FORMULARIO DE CREACIÓN DE PUBLICACIÓN
        =======================================================================
      */}
      <main className="flex-1 px-5 py-5 pb-28">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. Recuadro interactivo para cargar imagen */}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#3A3A39] bg-[#1F1F1E] transition-all hover:border-[#FF5E1B] cursor-pointer"
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
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
          </div>

          {/* 2. Campo: Ciudad y zona */}
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

          {/* 3. Campo: Sobre mí */}
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

          {/* 4. Campo: ¿Qué vas a ofrecer? */}
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

          {/* 5. Campo: Categoría del servicio */}
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
              {TAGS.map((tag) => {
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

          {/* 6. Campo: ¿Cuánto cobrarás por hora? */}
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
            disabled={isSubmitting}
            className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#FF5E1B] text-base font-bold text-black shadow-lg transition-transform hover:bg-[#fa530f] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Creando..." : "Crear"}
          </button>
        </form>
      </main>

      {/* Menú inferior de navegación */}
      <NavBar activeId="inicio" />
    </div>
  );
}
