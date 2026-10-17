import { cn } from "./cn";

const PRESETS = { xs: 32, sm: 40, md: 56, lg: 96, xl: 144 } as const;

interface AvatarProps {
  src?: string;
  name: string;
  size?: keyof typeof PRESETS | number;
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const px = typeof size === "number" ? size : PRESETS[size];
  return (
    <div
      style={{ width: px, height: px }}
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-truek-surface", className)}
    >
      {src ? (
        //To ignore the annoying next recomendation we put the next comment:
        // eslint-disable-next-line @next/next/no-img-element 
        <img src={src} alt={name} className="h-full w-full object-cover object-center" />
      ) : (
        <span
          style={{ fontSize: px * 0.4 }}
          className="flex h-full w-full items-center justify-center font-semibold text-white/70"
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}