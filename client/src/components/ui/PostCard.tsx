import { StarRating } from "./StarRating";
import { cn } from "./cn";

interface PostCardProps {
  /** Variante de presentación: 'card' para listados en feed y búsqueda, o 'detail' para vista completa */
  variant?: "card" | "detail";
  /** URL o Base64 de la imagen de portada de la experiencia */
  imageUrl: string;
  /** Nombre del autor o prestador del servicio */
  name: string;
  /** Lista de etiquetas o categorías asociadas */
  tags: string[];
  /** Calificación promedio en escala de 1 a 5 */
  rating: number;
  /** Ubicación o zona de prestación del servicio */
  location: string;
  /** Descripción personal o resumen de la experiencia */
  about: string;
  /** Edad del autor (opcional) */
  age?: string;
  /** Tiempo transcurrido desde la publicación (ej. 'Publicado hace 2 horas') */
  publishedAgo?: string;
  /** Detalle ampliado de la oferta o intercambio */
  offer?: string;
  /** Callback al accionar el enlace 'Ver más' */
  onSeeMore?: () => void;
  /** Texto del botón o enlace de acción (por defecto 'Ver más') */
  seeMoreLabel?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Subcomponente para renderizar las píldoras de categorías temáticas.
 */
function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key=
        {tag} 
          className="whitespace-nowrap rounded-full border border-truek-line bg-black px-3.5 py-0.5 text-[11px] leading-3.5 text-white">
        {tag}
        </li>
      ))}
    </ul>
  );
}

/**
 * Componente de tarjeta de publicación:
 * Muestra el contenido del truek en el feed principal o en los resultados de búsqueda,
 * adaptándose a pantallas móviles y de escritorio.
 */
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
      <article className={cn("w-full select-none px-10 text-white", className)}>
        <div className="mb-4 aspect-5/4 w-full overflow-hidden rounded-[20px] bg-truek-surface">
          {/*eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className="h-full w-full object-cover object-center" />
        </div>

        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{name}</h2>
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
        "w-full select-none rounded-[22px] border border-truek-line bg-truek-surface p-5 text-white",
        className,
      )}
    >
      <div className="mb-3 aspect-5/4 w-full overflow-hidden rounded-[18px] bg-truek-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover object-center" />
      </div>
      <h2 className="mb-3 text-base font-bold">{name}</h2>
      <p className="mb-3 text-sm font-medium text-white/80">{about}</p>
      <div className="mb-3"><Tags tags={tags} /></div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-white/70">{location}</span>
        <StarRating value={rating} size={16} />
      </div>
      <button
        type="button"
        onClick={onSeeMore}
        className="border-b-2 border-truek-lime pb-0.5 text-sm font-bold text-truek-lime focus:outline-none"
      >
        {seeMoreLabel}
      </button>
    </article>
  );
}