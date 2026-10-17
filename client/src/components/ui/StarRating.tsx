import { StarIcon } from "@heroicons/react/24/solid";
import { cn } from "./cn";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  showValue = false,
  className,
}: StarRatingProps) {
  const filled = Math.round(value);
  const interactive = typeof onChange === "function";

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center" style={{ gap: Math.round(size * 0.22) }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const star = (
            <StarIcon
              style={{ width: size, height: size }}
              className={n <= filled ? "text-truek-lime" : "text-truek-black"}
            />
          );
          return interactive ? (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              className="transition-transform active:scale-90 focus:outline-none"
            >
              {star}
            </button>
          ) : (
            <span key={n}>{star}</span>
          );
        })}
      </div>
      {showValue && !interactive && (
        <span className="ml-2 text-xs text-truek-white/70">{value.toFixed(1)}</span>
      )}
    </div>
  );
}