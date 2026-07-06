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

const cloudLogo = "/cloud_no_bg.png";

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
      <button className="absolute inset-0 bg-ink-950/18 backdrop-blur-[2px]" aria-label="Close navigation" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] border-r border-surface-line bg-[#f3f3f3] p-5 shadow-float">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img src={cloudLogo} alt="" className="h-10 w-10 shrink-0 object-contain" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink-950">Cloud Insure</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-500">Operations portal</p>
            </div>
          </div>
          <Button variant="ghost" className="px-2" aria-label="Close navigation" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-8 border-t border-surface-line pt-5">
          <nav className="space-y-1" aria-label="Mobile navigation">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "block border-l-2 border-transparent px-3 py-3 text-sm font-medium text-ink-600 transition-colors duration-150 hover:border-ink-300 hover:bg-white/70 hover:text-ink-950",
                    isActive && "border-ink-950 bg-white text-ink-950",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
