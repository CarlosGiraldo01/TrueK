"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

interface TopHeaderProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
}

export function TopHeader({ title, onBack, hideBack = false }: TopHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full select-none border-b border-truek-field bg-truek-black">
      <div className="relative flex h-15 items-center px-4">
        {!hideBack && (
          <button
            type="button"
            onClick={onBack ?? (() => router.back())}
            aria-label="Back"
            className="-ml-2 flex size-10 items-center justify-center text-white transition-opacity active:opacity-60 focus:outline-none"
          >
            <ChevronLeftIcon className="size-5" strokeWidth={2.2} />
          </button>
        )}
        <h1 className="pointer-events-none absolute left-1/2 max-w-[70%] -translate-x-1/2 truncate text-base font-semibold text-white">
          {title}
        </h1>
      </div>
    </header>
  );
}