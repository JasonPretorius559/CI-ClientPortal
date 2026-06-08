import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/useAuth";
import { isAdminUser } from "../../features/auth/auth.utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "My Cases", to: "/cases" },
  { label: "New Case", to: "/cases/new" },
  { label: "Admin Setup", to: "/admin/setup", adminOnly: true },
  { label: "Profile", to: "/profile" },
  { label: "Settings", to: "/settings" },
];

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminUser(user));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button className="absolute inset-0 bg-ink-950/40" aria-label="Close navigation" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-ink-950">Cloud Insure</p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-500">User portal</p>
          </div>
          <Button variant="ghost" className="px-2" aria-label="Close navigation" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Mobile navigation">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "block rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100",
                  isActive && "bg-ink-100 font-semibold text-ink-950",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
