import { NavBar, TopHeader } from "@/components/ui";


// This is for when the request of payment doesn't exist or the user is not part of that payment
export function PaymentNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Pago" />
      <p className="m-auto text-sm text-truek-placeholder">No existe este pago</p>
      <NavBar activeId="servicios" />
    </div>
  );
}