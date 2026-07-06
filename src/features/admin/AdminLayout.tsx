import { Link, NavLink, Outlet } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { cn } from "../../lib/cn";

const adminTabs = [
  { label: "Setup", to: "/admin/setup", icon: Settings2 },
];

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-ink-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/admin/setup" className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-500 no-underline">
            Admin
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-950">Masterfiles and setup</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Admin navigation">
          {adminTabs.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-md border border-ink-300 bg-white px-3 py-2 text-sm font-semibold text-ink-800 no-underline shadow-sm transition hover:bg-ink-100",
                    isActive && "border-ink-950 bg-ink-950 text-white hover:bg-ink-900",
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
