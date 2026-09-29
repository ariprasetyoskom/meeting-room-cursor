import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { DevAuthBanner } from "./DevAuthBanner";
import { MainNav } from "./MainNav";
import { UserMenu } from "./UserMenu";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/book" className="app-brand">
          Ruang Meeting
        </Link>
        <div className="app-header-end">
          <nav className="app-nav" aria-label="Utama">
            <MainNav />
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
