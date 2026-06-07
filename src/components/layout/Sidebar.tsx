import { NavLink } from "react-router-dom";
import { Briefcase, FilePlus2, Home, Settings, UserRound, LibraryBig } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/useAuth";
import { isAdminUser } from "../../features/auth/auth.utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "My Cases", to: "/cases", icon: Briefcase },
  { label: "New Case", to: "/cases/new", icon: FilePlus2 },
  { label: "Report Designer", to: "/admin/report-designs/new", icon: LibraryBig, adminOnly: true },
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminUser(user));

  return (
   <aside className="hidden h-screen w-64 shrink-0 border-r border-ink-200 bg-white px-4 py-5 lg:flex lg:flex-col">
      <div className="px-2">
        <p className="text-lg font-bold tracking-tight text-ink-950">Cloud Insure</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-500">User portal</p>
      </div>
      <nav className="mt-8 space-y-1" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100",
                  isActive && "bg-ink-100 font-semibold text-ink-950 shadow-[inset_3px_0_0_#111111]",
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
