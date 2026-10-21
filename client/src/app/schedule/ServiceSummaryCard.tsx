import { formatPrice } from "@/app/payment/formatPrice";
import { formatHours } from "../requests/formatService";

interface ServiceSummaryCardProps {
  title: string;
  imageUrl: string;
  providerName: string;
  hours: number;
  address?: string;
  pricePerHour?: number;
}

// Lime card with the picture of the service and its main data (Confirmar servicio, Servicio pedido).
export function ServiceSummaryCard({
  title,
  imageUrl,
  providerName,
  hours,
  address,
  pricePerHour,
}: ServiceSummaryCardProps) {
  return (
    <article className="flex gap-4 rounded-2xl border border-truek-lime/60 bg-truek-lime/10 p-3">
      <div className="aspect-4/3 w-[42%] shrink-0 overflow-hidden rounded-xl bg-truek-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className="h-full w-full object-cover object-center" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 py-1 text-sm">
        <h2 className="text-base font-bold leading-tight text-truek-lime">{title}</h2>
        <p className="truncate text-white">{providerName}</p>
        <p className="text-white/80">{formatHours(hours)}</p>
        {pricePerHour !== undefined && <p className="text-white/80">{formatPrice(pricePerHour)} / h</p>}
        {address && <p className="line-clamp-2 text-white/80">{address}</p>}
      </div>
    </article>
  );
}
