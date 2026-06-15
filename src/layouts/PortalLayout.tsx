import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { MobileNav } from "../components/layout/MobileNav";
import { Sidebar } from "../components/layout/Sidebar";
import { UserMenu } from "../components/layout/UserMenu";
import { Button } from "../components/ui/Button";
import { GlobalAnalysisProgressBanner } from "../features/cases/GlobalAnalysisProgressBanner";

export function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="dashboard-main">
        <header className="z-30 shrink-0 bg-transparent">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="px-2 lg:hidden"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>

              <span className="text-sm font-semibold tracking-[-0.01em] text-ink-950 lg:hidden">
                Cloud Insure
              </span>
            </div>

            <UserMenu />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-5 sm:pb-5 lg:px-7 lg:pb-7">
          <div className="workspace-canvas">
            <Outlet />
          </div>
        </main>
      </div>

      <GlobalAnalysisProgressBanner />
    </div>
  );
}
