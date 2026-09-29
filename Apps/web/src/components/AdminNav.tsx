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
    <nav className="admin-nav" aria-label="Admin">
      <span className="admin-nav-label">Admin</span>
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`app-nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
