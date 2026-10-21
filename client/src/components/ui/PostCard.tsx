"use client";

import { StarRating } from "./StarRating";
import { cn } from "./cn";

interface PostCardProps {
  variant?: "card" | "detail";
  imageUrl: string;
  name: string;
  tags: string[];
  rating: number;
  location: string;
  about: string;
  age?: string;
  publishedAgo?: string;
  offer?: string;
  onSeeMore?: () => void;
  seeMoreLabel?: string;
  className?: string;
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className="whitespace-nowrap rounded-full border border-[#2E2E2E] bg-black px-3.5 py-1 text-xs font-normal leading-tight text-white"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

export function PostCard({
  variant = "card",
  imageUrl,
  name,
  tags,
  rating,
  location,
  about,
  age,
  publishedAgo,
  offer,
  onSeeMore,
  seeMoreLabel = "Ver más",
  className,
}: PostCardProps) {
  if (variant === "detail") {
    return (
      <article className={cn("w-full select-none px-6 text-white", className)}>
        <div className="mb-4 aspect-5/4 w-full overflow-hidden rounded-[20px] bg-[#1E1E1E]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className="h-full w-full object-cover object-center" />
        </div>

        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">{name}</h2>
          {publishedAgo && <span className="shrink-0 text-xs text-white/50">{publishedAgo}</span>}
        </div>
        {age && <p className="mb-3 text-sm font-semibold text-white/70">{age}</p>}

        <div className="mb-3"><Tags tags={tags} /></div>
        <StarRating value={rating} showValue size={18} className="mb-2" />
        <p className="mb-5 text-sm text-white/70">{location}</p>

        <section className="mb-5">
          <h3 className="text-base font-bold">Sobre mí</h3>
          <p className="mt-1 text-sm leading-tight text-white/75">{about}</p>
        </section>
        {offer && (
          <section className="mb-5">
            <h3 className="text-base font-bold">Qué ofrezco</h3>
            <p className="mt-1 text-sm leading-tight text-white/75">{offer}</p>
          </section>
        )}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "w-full select-none rounded-[24px] border border-[#2E2E2E] bg-[#1B1B1B] p-4 text-white shadow-md transition-all duration-200 hover:border-[#3E3E3E]",
        className,
      )}
    >
      {/* Contenedor de imagen principal con esquinas redondeadas */}
      <div className="mb-3.5 aspect-5/4 w-full overflow-hidden rounded-[18px] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
      </div>

      {/* Nombre del usuario */}
      <h2 className="mb-2 text-base font-bold text-white">{name}</h2>

      {/* Descripción corta / Sobre mí */}
      <p className="mb-3 text-sm font-normal leading-snug text-white/80">{about}</p>

      {/* Etiquetas / Tags */}
      <div className="mb-3">
        <Tags tags={tags} />
      </div>

      {/* Fila: Ubicación a la izquierda, Calificación en estrellas a la derecha */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm text-[#9CA3AF]">{location}</span>
        <StarRating value={rating} size={15} />
      </div>

      {/* Enlace 'Ver más' con estilo subrayado lima */}
      <button
        type="button"
        onClick={onSeeMore}
        className="text-sm font-bold text-[#D3FC31] underline decoration-[#D3FC31] underline-offset-4 transition-opacity hover:opacity-80 active:opacity-60 focus:outline-none cursor-pointer"
      >
        {seeMoreLabel}
      </button>
    </article>
  );
}
