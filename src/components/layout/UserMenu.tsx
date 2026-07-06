import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleUserRound, LogOut, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/useAuth";
import { getUserDisplayName } from "../../lib/user";
import * as authApi from "../../features/auth/auth.api";
import { normalizeAuthUser } from "../../features/auth/auth.utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(value: unknown, keys: string[]) {
  if (!isRecord(value)) return null;

  for (const key of keys) {
    const candidate = value[key];

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim()) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function AnalysisCreditSummary({ user }: { user: unknown }) {
  const remaining = readNumber(user, ["analysisRemaining", "remainingAnalyses", "analysisCreditsRemaining"]);
  const limit = readNumber(user, ["analysisLimit", "analysisCredits", "analysisAllowance"]);
  const used = readNumber(user, ["analysisUsed", "usedAnalyses"]);

  if (remaining === null && limit === null && used === null) return null;

  const isDepleted = remaining !== null && remaining <= 0;
  const label = remaining === null ? "Analysis credits" : `${remaining} credits left`;
  const detail = limit !== null && used !== null ? `${used} of ${limit} used` : "1 credit is deducted per completed analysis";

  return (
    <div
      className={[
        "flex items-center gap-2 border px-3 py-2 text-xs font-medium",
        isDepleted
          ? "border-danger-100 bg-danger-50 text-danger-700"
          : "border-surface-line bg-surface-muted text-ink-700",
      ].join(" ")}
      title={isDepleted ? "Analysis limit reached. Please purchase more analysis credits to continue." : detail}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => normalizeAuthUser(await authApi.getMe()),
    initialData: user,
    enabled: Boolean(user),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const currentUser = userQuery.data ?? user;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        className="h-11 w-11 px-0"
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleUserRound className="h-5 w-5" aria-hidden="true" />
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-72 border border-surface-line bg-white p-4 shadow-float">
          <div className="border-b border-surface-line pb-3">
            <p className="text-sm font-semibold text-ink-950">{getUserDisplayName(currentUser)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-500">Account</p>
          </div>

          <div className="mt-4 space-y-3">
            <AnalysisCreditSummary user={currentUser} />
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
