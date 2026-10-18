"use client";

import { useRouter } from "next/navigation";
import { Button, NavBar, TopHeader } from "@/components/ui";
import { PaymentResult } from "../../PaymentResult";

export default function PaymentSuccessPage() {
  const router = useRouter();

return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Pago" onBack={() => router.push("/requests")} />
      <div className="flex flex-1 flex-col items-center px-6 pt-21">
        <PaymentResult title="Pago exitoso!" message="Tu servicio ha sido pagado correctamente" />
        <div className="mt-28 w-full px-19">
          <Button variant="accent" onClick={() => router.push("/home")}>
            Volver al inicio
          </Button>
        </div>
      </div>
      <NavBar activeId="servicios" />
    </div>
  );
}