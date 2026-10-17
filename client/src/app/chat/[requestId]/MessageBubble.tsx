import { cn } from "@/components/ui/cn";

interface MessageBubbleProps {
  content: string;
  mine: boolean;
  senderRole: "client" | "provider";
}

export function MessageBubble({ content, mine, senderRole }: MessageBubbleProps) {
  return (
    <div className={cn("flex items-center gap-2", mine ? "justify-end" : "justify-start")}>
      <p
        className={cn("max-w-[75%] whitespace-pre-line rounded-2xl border bg-truek-line px-4 py-2 text-sm leading-snug text-white",
          mine ? "rounded-tr-none" : "rounded-tl-none", senderRole === "client" ? "border-truek-orange" : "border-truek-lime",)}
      >
        {content}
      </p>
      {mine && <span className="text-sm font-medium text-truek-placeholder">Tú</span>}
    </div>
  );
}