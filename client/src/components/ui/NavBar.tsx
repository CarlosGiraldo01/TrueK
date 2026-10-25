"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  MapIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { ServiceBellIcon } from "@/components/icons/ServiceBellIcon";
import { useSession } from "@/context/SessionContext";

export type NavItemId = "inicio" | "buscar" | "servicios" | "mapa" | "perfil";

interface NavBarProps {
  activeId?: NavItemId;
  onSelect?: (id: NavItemId) => void;
}

// Barra de navegación inferior
export function NavBar({ activeId, onSelect }: NavBarProps) {
  const pathname = usePathname();
  const { activeRole } = useSession();

  // Dependiendo del rol mandamos al feed de provider o client
  const feedHref = activeRole === "provider" ? "/feed/provider" : "/feed/client";

  // Las pestañas del menú de abajo
  const navItems = [
    { id: "inicio", label: "Inicio", href: feedHref, Icon: HomeIcon },
    { id: "buscar", label: "Buscar", href: "/search", Icon: MagnifyingGlassIcon },
    { id: "servicios", label: "Servicios", href: "/requests", Icon: ServiceBellIcon },
    { id: "mapa", label: "Mapa", href: "/map", Icon: MapIcon },
    { id: "perfil", label: "Perfil", href: "/profile", Icon: UserIcon },
  ];

  // Saber cuál pestaña iluminar según la URL actual
  const isFeedPage = pathname.startsWith("/feed") || pathname.startsWith("/home") || pathname === "/";
  const currentId = activeId ?? (isFeedPage ? "inicio" : navItems.find((item) => pathname.startsWith(item.href))?.id);

  return (
    <nav className="sticky bottom-0 z-50 mt-auto select-none border-t border-[#2A2A29] bg-[#161615] pb-4">
      <ul className="flex items-center justify-around px-1 pt-3.5">
        {navItems.map(({ id, label, href, Icon }) => {
          const active = id === currentId;
          const classes = `flex flex-col items-center justify-center transition-colors focus:outline-none ${
            active ? "text-white" : "text-[#5F5F5F] hover:text-[#8A8A8A]"
          }`;

          const content = (
            <>
              <Icon className="size-7" strokeWidth={1.8} />
              <span className="mt-2 text-xs font-semibold leading-4">{label}</span>
            </>
          );

          return (
            <li key={id} className="flex flex-1 justify-center">
              {onSelect ? (
                <button type="button" onClick={() => onSelect(id as NavItemId)} className={classes} aria-label={label}>
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