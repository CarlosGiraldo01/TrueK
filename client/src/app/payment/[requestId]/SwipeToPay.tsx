"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/components/ui/cn";

const THUMB = 70; 

interface SwipeToPayProps {
  onComplete: () => void;
}

export function SwipeToPay({ onComplete }: SwipeToPayProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const maxOffset = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  const handleDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX - offset;
    maxOffset.current = (trackRef.current?.clientWidth ?? 0) - THUMB;
    setDragging(true);
  };

  const handleMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    const next = e.clientX - startX.current;
    setOffset(Math.min(Math.max(next, 0), maxOffset.current));
  };

  const handleUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (offset >= maxOffset.current * 0.9) {
      setOffset(maxOffset.current);
      setDone(true);
      setTimeout(onComplete, 400);
    } else {
      setOffset(0);
    }
  };

  const fillWidth = done ? "100%" : offset > 0 ? offset + THUMB : 0;

  return (
    <div ref={trackRef}
      className="relative flex h-18 select-none items-center overflow-hidden rounded-full border border-truek-lime bg-black">
      <div
        style={{ width: fillWidth }}
        className={cn(
          "absolute inset-y-0 left-0 rounded-full bg-truek-lime",
          !dragging && "transition-all duration-300",
        )}
      />
    <span className={cn
      ("pointer-events-none absolute inset-x-0 text-center text-base font-medium text-white/70 transition-opacity",
        offset > 0 && "opacity-0",
    )}>
        Desliza para pagar
      </span>
      <button
        type="button"
        aria-label="Desliza para pagar"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn
            ("relative flex size-17.5 shrink-0 touch-none cursor-grab items-center justify-center rounded-full border focus:outline-none",
          done
            ? "border-truek-lime bg-truek-black text-truek-lime" : "border-truek-lime bg-truek-lime text-truek-black", !dragging && "transition-transform duration-300",
        )}
      >
        <ArrowRightIcon className="size-9" strokeWidth={2.5} />
      </button>
    </div>
  );
}