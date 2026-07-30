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
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-ink-950 px-5 py-6 text-white lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10">
          <img src={cloudLogo} alt="" className="h-8 w-8 object-contain brightness-0 invert" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold tracking-[-0.03em] text-white">Cloud Insure</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Operations portal</p>
        </div>
      </div>

      <div className="mt-8 flex-1">
        <p className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</p>
        <nav className="mt-3 space-y-1" aria-label="Main navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/cases"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-white/60 no-underline transition-colors duration-150 hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
                    isActive && "border-brand-500/30 bg-brand-600/20 text-white",
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
