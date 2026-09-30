"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appPortalHref } from "@/lib/portal-client";

const links = [
  { href: "/book", label: "Booking", match: (p: string) => p === "/book" || p === "/" },
  { href: "/rooms", label: "Ruang", match: (p: string) => p.startsWith("/rooms") },
  {
    href: "/bookings",
    label: "Booking saya",
    match: (p: string) => p.startsWith("/bookings"),
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="segmented-nav main-nav" aria-label="Utama">
      {links.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={appPortalHref(item.href)}
            className={`app-nav-link ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
