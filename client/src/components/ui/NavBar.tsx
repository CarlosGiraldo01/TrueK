"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  MapIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { ServiceBellIcon } from "@/components/icons/ServiceBellIcon";
import { cn } from "./cn";

export type NavItemId = "inicio" | "buscar" | "servicios" | "mapa" | "perfil";

const NAV_ITEMS: {
  id: NavItemId;
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "inicio", label: "Inicio", href: "/home", Icon: HomeIcon },
  { id: "buscar", label: "Buscar", href: "/search", Icon: MagnifyingGlassIcon },
  { id: "servicios", label: "Servicios", href: "/requests", Icon: ServiceBellIcon },
  { id: "mapa", label: "Mapa", href: "/map", Icon: MapIcon },
  { id: "perfil", label: "Perfil", href: "/profile", Icon: UserIcon },
];

interface NavBarProps {
  activeId?: NavItemId;
  onSelect?: (id: NavItemId) => void;
}

export function NavBar({ activeId, onSelect }: NavBarProps) {
  const pathname = usePathname();
  const currentId =
    activeId ?? NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.id;

  return (
    <nav className="sticky bottom-0 z-50 mt-auto select-none border-t border-truek-field bg-truek-black pb-[max(env(safe-area-inset-bottom),15px)]">
      <ul className="flex items-center justify-around px-1 pt-3.5">
        {NAV_ITEMS.map(({ id, label, href, Icon }) => {
          const active = id === currentId;
          const content = (
            <>
              <Icon className="size-7.5" strokeWidth={1.8} />
              <span className="mt-3.5 text-sm font-semibold leading-4">{label}</span>
            </>
          );
          const classes = cn(
            "flex flex-col items-center justify-center transition-colors focus:outline-none",
            active ? "text-white" : "text-truek-input",
          );
          return (
            <li key={id} className="flex flex-1 justify-center">
              {onSelect ? (
                <button type="button" onClick={() => onSelect(id)} className={classes} aria-label={label}>
                  {content}
                </button>
              ) : (
                <Link href={href} className={classes} aria-label={label} aria-current={active ? "page" : undefined}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}