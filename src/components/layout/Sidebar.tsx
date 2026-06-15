import { NavLink } from "react-router-dom";
import { Briefcase, Coins, FilePlus2, Home, Landmark, Settings, UserRound, Settings2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/useAuth";
import { isAdminUser } from "../../features/auth/auth.utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "My Cases", to: "/cases", icon: Briefcase },
  { label: "New Case", to: "/cases/new", icon: FilePlus2 },
  { label: "AI Cost Dashboard", to: "/admin/finance", icon: Coins, adminOnly: true },
  { label: "Financial Settings", to: "/admin/financial-settings", icon: Landmark, adminOnly: true },
  { label: "Admin Setup", to: "/admin/setup", icon: Settings2, adminOnly: true },
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings },
];

const cloudLogo = "/cloud_no_bg.png";

export function Sidebar() {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminUser(user));

  return (
    <aside className="hidden h-screen w-72 shrink-0 bg-surface-canvas px-5 py-6 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2 py-2">
        <img src={cloudLogo} alt="" className="h-11 w-11 shrink-0 object-contain" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-ink-950">Cloud Insure</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-500">Operations portal</p>
        </div>
      </div>
      <div className="mt-8 rounded-[24px] bg-white p-3 shadow-soft">
        <nav className="space-y-1" aria-label="Main navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-ink-600 transition-colors duration-150 hover:bg-surface-muted hover:text-ink-950",
                    isActive && "bg-brand-50 font-semibold text-brand-800",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
