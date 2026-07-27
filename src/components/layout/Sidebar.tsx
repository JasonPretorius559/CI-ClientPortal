import { NavLink } from "react-router-dom";
import { Bell, Briefcase, FilePlus2, Home, Settings, Settings2, UserRound } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/useAuth";
import { isAdminUser } from "../../features/auth/auth.utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "My Cases", to: "/cases", icon: Briefcase },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "New Case", to: "/cases/new", icon: FilePlus2 },
  { label: "Admin Setup", to: "/admin/setup", icon: Settings2, adminOnly: true },
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings },
];

const cloudLogo = "/cloud_no_bg.png";

export function Sidebar() {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminUser(user));

  return (
    <aside className="hidden fixed inset-y-0 left-0 z-20 w-72 shrink-0 overflow-y-auto border-r border-surface-line bg-[#f3f3f3] px-5 py-6 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <img src={cloudLogo} alt="" className="h-11 w-11 object-contain" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-base font-bold tracking-[-0.03em] text-ink-950">Cloud Insure</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-400">Operations portal</p>
        </div>
      </div>

      <div className="mt-8 flex-1">
        <p className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-400">Workspace</p>
        <nav className="mt-3 space-y-1" aria-label="Main navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-sm font-medium text-ink-600 transition-colors duration-150 hover:border-ink-300 hover:bg-white/70 hover:text-ink-950",
                    isActive && "border-ink-950 bg-white text-ink-950",
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
