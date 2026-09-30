import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { BrandLogo } from "./BrandLogo";
import { DevAuthBanner } from "./DevAuthBanner";
import { MainNav } from "./MainNav";
import { UserMenu } from "./UserMenu";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/book" className="app-brand" aria-label="Ruang Meeting — beranda">
            <BrandLogo />
            <span className="app-brand-text">
              <span className="app-brand-name">Ruang Meeting</span>
              <span className="app-brand-tagline">Booking internal</span>
            </span>
          </Link>
          <div className="app-header-end">
            <div className="app-nav-scroll">
              <MainNav />
              <AdminNav />
            </div>
            <div className="user-menu-slot">
              <UserMenu />
            </div>
          </div>
        </div>
        <DevAuthBanner />
      </header>
      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
