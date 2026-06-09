import { LogOut, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

function AnalysisCreditIndicator({ user }: { user: unknown }) {
  const remaining = readNumber(user, ["analysisRemaining", "remainingAnalyses", "analysisCreditsRemaining"]);
  const limit = readNumber(user, ["analysisLimit", "analysisCredits", "analysisAllowance"]);
  const used = readNumber(user, ["analysisUsed", "usedAnalyses"]);

  if (remaining === null && limit === null && used === null) return null;

  const isDepleted = remaining !== null && remaining <= 0;
  const label = remaining === null ? "Analysis credits" : `${remaining} analysis ${remaining === 1 ? "credit" : "credits"} left`;
  const detail = limit !== null && used !== null ? `${used} of ${limit} used` : "1 credit is deducted per completed analysis";

  return (
    <div
      className={[
        "hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex",
        isDepleted
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-ink-200 bg-ink-50 text-ink-700",
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
  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => normalizeAuthUser(await authApi.getMe()),
    initialData: user,
    enabled: Boolean(user),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const currentUser = userQuery.data ?? user;

  return (
    <div className="flex items-center gap-3">
      <AnalysisCreditIndicator user={currentUser} />
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-semibold text-ink-950">{getUserDisplayName(currentUser)}</p>
        <p className="truncate text-xs text-ink-500">Signed in</p>
      </div>
      <Button variant="ghost" onClick={logout} aria-label="Log out">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}
