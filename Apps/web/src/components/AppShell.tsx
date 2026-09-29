import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { DevAuthBanner } from "./DevAuthBanner";
import { UserMenu } from "./UserMenu";

const nav = [
  { href: "/book", label: "Booking" },
  { href: "/rooms", label: "Ruang" },
  { href: "/bookings", label: "Booking saya" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/book" className="app-brand">
          Ruang Meeting
        </Link>
        <div className="app-header-end">
          <nav className="app-nav" aria-label="Utama">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="app-nav-link">
                {item.label}
              </Link>
            ))}
            <AdminNav />
          </nav>
          <UserMenu />
        </div>
      </header>
      <DevAuthBanner />
      <main className="app-main">{children}</main>
    </div>
  );
}
