"use client";

import { useRouter } from "next/navigation";
import { Button, Logo } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex items-center gap-6">
        <Logo variant="icon" height={64} />
        <div className="h-24 w-0.5 rotate-20 bg-truek-lime" />
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-truek-lime">Error 404</h1>
          <p className="mt-2 max-w-32 text-sm font-semibold leading-snug text-truek-lime">
            No se encontró lo que buscabas.
          </p>
        </div>
      </div>

      <div className="mt-14 w-full px-19">
        <Button variant="accent" onClick={() => router.push("/home")}>
          Volver a inicio
        </Button>
      </div>
    </div>
  );
}