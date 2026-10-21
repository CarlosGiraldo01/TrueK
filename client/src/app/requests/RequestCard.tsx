import Link from "next/link";
import type { RequestRole } from "../../context/RequestContext";
import type { Post, ServiceRequest, User } from "@/lib/mock";
import { cn } from "@/components/ui/cn";
import { formatHours } from "./formatService";

type Tone = "lime" | "orange" | "muted";

// Title and dot color of the card, depending on who looks at it and the status.
function getCardState(
  status: ServiceRequest["status"],
  role: RequestRole,
): { title: string; note?: string; tone: Tone } {
  switch (status) {
    case "pending":
      return role === "client"
        ? { title: "Solicitud de servicio", note: "En proceso...", tone: "lime" }
        : { title: "Solicitud de servicio", note: "Nueva solicitud", tone: "lime" };
    case "accepted":
      return role === "client"
        ? { title: "Solicitud aceptada", tone: "lime" }
        : { title: "Servicio activo", tone: "lime" };
    case "active":
      return { title: "Servicio activo", tone: "lime" };
    case "finished":
      return { title: "Servicio finalizado", tone: "lime" };
    case "rejected":
      return { title: "Servicio rechazado", tone: "orange" };
    case "cancelled":
      return { title: "Servicio cancelado", tone: "muted" };
  }
}

const dotTones: Record<Tone, string> = {
  lime: "bg-truek-lime",
  orange: "bg-truek-orange",
  muted: "bg-truek-input",
};

interface RequestCardProps {
  request: ServiceRequest;
  post: Post;
  person: User | undefined; // The other person of the request.
  role: RequestRole;
}

// Small card of the Services tab. Tapping it opens the detail.
export function RequestCard({ request, post, person, role }: RequestCardProps) {
  const { title, note, tone } = getCardState(request.status, role);

  return (
    <Link
      href={`/requests/${request.id}`}
      className={cn(
        "relative flex overflow-hidden rounded-2xl border bg-black transition-transform active:scale-[0.99]",
        tone === "orange" ? "border-truek-orange/60" : "border-truek-line",
      )}
    >
      <div className="w-[42%] shrink-0 bg-truek-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={request.request_image ?? post.post_image}
          alt={post.name}
          className="h-full min-h-28 w-full object-cover object-center"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1 px-4 py-3.5 text-xs text-white/80">
        <h2 className="pr-4 text-sm font-bold text-white">{title}</h2>
        <p className="truncate">{person?.name ?? "Usuario"}</p>
        <p>{formatHours(request.hours)}</p>
        <p className="line-clamp-2">{request.meeting_address}</p>
        {note && <p className="pt-1 font-semibold text-truek-lime">{note}</p>}
      </div>
      <span className={cn("absolute right-3 top-3 size-3 rounded-full", dotTones[tone])} aria-hidden="true" />
    </Link>
  );
}
