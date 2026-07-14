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
          <Link to="/admin/setup" className="text-[10px] font-bold uppercase tracking-[0.18em] text-warning-700 no-underline">Admin</Link>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink-950">Masterfiles and setup</h1>
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
                    "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold no-underline shadow-sm transition",
                    isActive
                      ? "border-ink-950 bg-ink-950 text-white hover:bg-ink-900"
                      : "border-ink-300 bg-white text-ink-800 hover:bg-ink-100",
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
