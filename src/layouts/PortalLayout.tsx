import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, ShieldCheck } from "lucide-react";
import { MobileNav } from "../components/layout/MobileNav";
import { Sidebar } from "../components/layout/Sidebar";
import { UserMenu } from "../components/layout/UserMenu";
import { Button } from "../components/ui/Button";
import { GlobalAnalysisProgressBanner } from "../features/cases/GlobalAnalysisProgressBanner";
import { AnalysisProgressStreamBridge } from "../features/cases/AnalysisProgressStreamBridge";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { NotificationStreamBridge } from "../features/notifications/NotificationStreamBridge";

export function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="dashboard-main lg:pl-72">
        <header className="sticky top-0 z-30 shrink-0 border-b border-surface-line/80 bg-surface-canvas/85 backdrop-blur-xl">
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
              <div className="hidden items-center gap-2 text-xs font-semibold text-ink-500 lg:flex">
                <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                Secure analysis workspace
              </div>
            </div>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-1 pb-4 sm:px-3 sm:pb-5 lg:px-5 lg:pb-7">
          <div className="workspace-canvas">
            <Outlet />
          </div>
        </main>
      </div>

      <GlobalAnalysisProgressBanner />
      <AnalysisProgressStreamBridge />
      <NotificationStreamBridge />
    </div>
  );
}
