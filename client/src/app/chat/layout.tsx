import type { ReactNode } from "react";
import { PrivateRoute } from "@/components/ui/PrivateRoute";

// Todas las pantallas de esta carpeta necesitan sesión iniciada.
// Si no hay sesión, PrivateRoute manda al usuario a /login.
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}
