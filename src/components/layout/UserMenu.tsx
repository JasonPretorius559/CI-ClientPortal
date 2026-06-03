import { LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/useAuth";
import { getUserDisplayName } from "../../lib/user";

export function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-semibold text-ink-950">{getUserDisplayName(user)}</p>
        <p className="truncate text-xs text-ink-500">Signed in</p>
      </div>
      <Button variant="ghost" onClick={logout} aria-label="Log out">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}
