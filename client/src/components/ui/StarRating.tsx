"use client";

import { StarIcon } from "@heroicons/react/24/solid";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  className?: string;
}

// Componente para mostrar u opinar con estrellas
export function StarRating({
  value,
  onChange,
  size = 16,
  showValue = false,
  className = "",
}: StarRatingProps) {
  const filled = Math.round(value);
  const interactive = typeof onChange === "function";

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center" style={{ gap: Math.round(size * 0.2) }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const star = (
            <StarIcon
              key={n}
              style={{ width: size, height: size }}
              className={n <= filled ? "text-[#D3FC31]" : "text-[#363636]"}
            />
          );
          return interactive ? (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              className="transition-transform active:scale-90 focus:outline-none cursor-pointer"
            >
              {star}
            </button>
          ) : (
            <span key={n}>{star}</span>
          );
        })}
      </div>
      {showValue && !interactive && (
        <span className="ml-2 text-xs text-white/70">{value.toFixed(1)}</span>
      )}
    </div>
  );
}