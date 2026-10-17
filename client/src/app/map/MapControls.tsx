import type { Map as LeafletMap } from "leaflet";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { USER_POSITION } from "./constants";

interface MapControlsProps {
  map: LeafletMap | null;
}

const buttonClass =
  "pointer-events-auto flex size-12 items-center justify-center rounded-2xl bg-truek-black shadow-lg";

function LocateIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className={className}
    >
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function MapControls({ map }: MapControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <button type="button" aria-label="Acercar" className={`${buttonClass} text-white`} onClick={() => map?.zoomIn()}>
        <PlusIcon className="size-7" strokeWidth={3} />
      </button>
      <button type="button" aria-label="Alejar" className={`${buttonClass} text-white`} onClick={() => map?.zoomOut()}>
        <MinusIcon className="size-7" strokeWidth={3} />
      </button>
      <button
        type="button"
        aria-label="Mi ubicación"
        className={`${buttonClass} text-truek-orange`}
        onClick={() => map?.flyTo(USER_POSITION, 14)}
      >
        <LocateIcon className="size-7" />
      </button>
    </div>
  );
}