"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionProfile } from "@/hooks/useSessionProfile";

const links = [
  { href: "/admin/rooms", label: "Ruang" },
  { href: "/admin/bookings", label: "Semua booking" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { isAdmin, loading } = useSessionProfile();

  if (loading || !isAdmin) return null;

  return (
    <nav className="segmented-nav admin-nav" aria-label="Admin">
      <span className="admin-nav-label">Admin</span>
      {links.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
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
