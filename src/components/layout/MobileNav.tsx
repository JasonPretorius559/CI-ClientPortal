import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/useAuth";
import { isAdminUser } from "../../features/auth/auth.utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "My Cases", to: "/cases" },
  { label: "Notifications", to: "/notifications" },
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
      <div className="absolute inset-y-0 left-0 w-80 max-w-[88vw] border-r border-white/10 bg-ink-950 p-5 text-white shadow-float">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10">
              <img src={cloudLogo} alt="" className="h-8 w-8 object-contain brightness-0 invert" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-white">Cloud Insure</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Operations portal</p>
            </div>
          </div>
          <Button variant="ghost" className="px-2 text-white hover:bg-white/10 hover:text-white" aria-label="Close navigation" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-7 border-t border-white/10 pt-5">
          <nav className="space-y-1" aria-label="Mobile navigation">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/cases"}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "block rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-white/60 no-underline transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
                    isActive && "border-brand-500/30 bg-brand-600/20 text-white",
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
