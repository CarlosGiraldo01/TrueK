import { forwardRef, useId } from "react";
import { cn } from "./cn";

interface BaseProps {
  label?: string;
  error?: string;
  className?: string;
}

type InputProps = BaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
    multiline?: false;
  };

type TextAreaProps = BaseProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    multiline: true;
  };

const fieldBase =
  "w-full rounded-xl bg-truek-field px-3.5 text-xs text-white placeholder:text-truek-placeholder " +
  "border-0 outline-none transition-shadow focus:ring-1 focus:ring-white/30";

export const TextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps | TextAreaProps
>(function TextField({ label, error, className, multiline, ...fieldProps }, ref) {
  const id = useId();

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {label && (
        <label htmlFor={id} className="mb-2 select-none text-sm text-white">
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          id={id}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={4}
          className={cn(fieldBase, "resize-none py-2.5")}
          {...(fieldProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          ref={ref as React.Ref<HTMLInputElement>}
          type="text"
          className={cn(fieldBase, "h-9")}
          {...(fieldProps as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && <span className="mt-1 text-[13px] text-truek-orange">{error}</span>}
    </div>
  );
});