import { ServiceBellIcon } from "@/components/icons/ServiceBellIcon";
import { Avatar } from "../Avatar";
import { cn } from "../cn";

export type NotificationTone = "lime" | "orange";

export interface NotificationBaseProps {
  tone: NotificationTone;
  name: string;
  message: string;
  avatarUrl?: string;
  tag?: string;
  onClick?: () => void;
  className?: string;
}

const tones: Record<NotificationTone, { border: string; icon: string }> = {
  lime: { border: "border-truek-lime", icon: "text-truek-lime" },
  orange: { border: "border-truek-orange", icon: "text-truek-orange" },
};

export function NotificationBase({
  tone,
  name,
  message,
  avatarUrl,
  tag,
  onClick,
  className,
}: NotificationBaseProps) {
  const t = tones[tone];
  return (
    <div
      onClick={onClick}
      className={cn("relative w-[66%] min-w-67.5 select-none", onClick && "cursor-pointer", className)}
    >
      <div
        className={cn(
          "absolute -left-3.75 -top-3.25 z-10 flex size-9 items-center justify-center rounded-full bg-truek-black",
          t.icon,
        )}
      >
        <ServiceBellIcon className="size-6.5" strokeWidth={1.8} />
      </div>

      <article
        className={cn(
          "flex items-center gap-4 rounded-l-[30px] border border-r-0 bg-truek-black py-5 pl-2.5 pr-3",
          t.border,
        )}
      >
        <Avatar src={avatarUrl} name={name} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold leading-snug text-white">{name}</h2>
          <p className="text-sm leading-snug text-white/90">{message}</p>
          {tag && (
            <span className="mt-2 inline-block rounded-full border border-truek-line bg-black px-3 py-0.5 text-[11px] leading-3.5 text-white">
              {tag}
            </span>
          )}
        </div>
      </article>
    </div>
  );
}