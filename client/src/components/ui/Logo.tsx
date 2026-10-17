import Image from "next/image";

const LOGOS = {
  horizontal: { src: "/brand/logo-horizontal.png", width: 890, height: 274 },
  vertical: { src: "/brand/logo-vertical.png", width: 731, height: 632 },
  icon: { src: "/brand/logo-icon.png", width: 641, height: 387 },
} as const;

interface LogoProps {
  variant?: keyof typeof LOGOS;
  height?: number;
  className?: string;
}

export function Logo({ variant = "horizontal", height = 40, className }: LogoProps) {
  const logo = LOGOS[variant];
  const width = Math.round((logo.width / logo.height) * height);

  return (
    <Image
      src={logo.src}
      alt="TrueK"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}