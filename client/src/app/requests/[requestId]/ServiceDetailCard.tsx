import type { ReactNode } from "react";
import { Avatar } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import type { ServiceRequest, User } from "@/lib/mock";
import { formatPrice } from "@/app/payment/formatPrice";
import { formatDate, formatHours, formatMeetingTime } from "../formatService";
//tipo de las etiquetas los colores 
type BadgeTone = "lime" | "orange" | "muted";
//estilo bordes y quetales 
const badgeTones: Record<BadgeTone, string> = {lime: "border-truek-lime bg-truek-lime/15 text-truek-lime",orange: "border-truek-orange bg-truek-orange/15 text-truek-orange",muted: "border-truek-line bg-truek-field text-white/70",};

// La etiquetita de estado (como "Activo", "Rechazado", "Finalizado").
// Recibe la palabra que va a decir ("label") y su color ("tone").
// Si no le decimos el color, usa verde limón.
export function StatusBadge({ label, tone = "lime" }: { label: string; tone?: BadgeTone }) {
  return (
    <span className={cn("shrink-0 rounded-full border px-3 py-0.5 text-xs font-semibold", badgeTones[tone])}>{label}</span>
  );
}
// Una "fila" de información: a la izquierda el nombre del dato
// y a la derecha lo que vale. Por ejemplo: "Fecha :     20 de octubre".
// Esta pieza es solo para usarla aquí adentro (no tiene "export").
function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-white/70">{label} :</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

interface ServiceDetailCardProps {
  person: User | undefined; 
  request: ServiceRequest;
  imageUrl: string;
  badge?: ReactNode; //La etiquetita de estado. El "?" significa que es opcional.
  children?: ReactNode; // Lo que va abajo del todo: botones, estrellitas, mensajes...
}

// La tarjeta de detalles. Es como un molde que usan TODAS las pantallas del pedido
// (esperando, activo, terminado...). Cada pantalla solo cambia la etiqueta y lo de abajo.
export function ServiceDetailCard({ person, request, imageUrl, badge, children }: ServiceDetailCardProps) {
   // Guardamos el nombre de la persona. Si no lo sabemos, decimos "Usuario".
  const name = person?.name ?? "Usuario";
// Aquí dibujamos la tarjeta:
  return (
    <section className="rounded-3xl border border-truek-line bg-truek-surface p-5">
      <div className="flex items-start gap-4">
        <Avatar src={person?.profile_picture ?? undefined} name={name} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-white">{name}</h2>
          {person && (
            <div className="mt-1 space-y-0.5 text-xs text-white/70">
              <p>Edad: {person.age} años</p>
              <p className="truncate">Ubicación: {person.location}</p>
            </div>
          )}
        </div>
      </div>

      <div className="my-5 h-px bg-truek-line" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-white">Datos del servicio</h3>
        {badge}
      </div>
      <div className="space-y-2.5 text-sm">
        <Row label="Dirección" value={request.meeting_address} />
        <Row label="Fecha" value={formatDate(request.meeting_date)} />
        <Row label="Hora" value={formatMeetingTime(request.meeting_date)} />
        <Row label="Duración" value={formatHours(request.hours)} />
        <Row label="Total" value={formatPrice(request.price)} />
      </div>

      <div className="mt-5 aspect-video w-full overflow-hidden rounded-2xl bg-truek-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Imagen del servicio" className="h-full w-full object-cover object-center" />
      </div>

      {children}
    </section>
  );
}
