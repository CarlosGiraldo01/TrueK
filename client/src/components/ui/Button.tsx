import { forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "accent" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-truek-lime text-truek-black",
  accent: "bg-truek-orange text-truek-black",
  outline: "border border-truek-lime bg-transparent text-truek-lime",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", fullWidth = true, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 select-none items-center justify-center rounded-[10px] px-4 text-base font-bold",
        "transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        "disabled:pointer-events-none disabled:opacity-40",
        fullWidth ? "w-full" : "w-auto",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});