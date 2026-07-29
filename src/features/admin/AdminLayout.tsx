import { Link, NavLink, Outlet } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { cn } from "../../lib/cn";

const adminTabs = [
  { label: "Setup", to: "/admin/setup", icon: Settings2 },
];

export function AdminLayout() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <Link to="/admin/setup" className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand-700 no-underline">Administration</Link>
            <p className="mt-0.5 text-sm font-semibold text-ink-950">Masterfiles and setup</p>
          </div>
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
                    "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold no-underline transition",
                    isActive
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-surface-line bg-white text-ink-800 hover:border-brand-200 hover:bg-brand-50",
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
