import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Clock3, Mail, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { getPreferences, resetPreferences, updatePreferences } from "./notifications.api";
import type { NotificationPreference } from "./notifications.types";

const definitions = [
  { eventType: "CASE_SUBMITTED", category: "case", label: "Case activity", description: "Submissions and material case changes", emailDefault: false },
  { eventType: "ANALYSIS_COMPLETED", category: "analysis", label: "Analysis updates", description: "Completed analyses and results ready for review", emailDefault: true },
  { eventType: "COMMENT_ADDED", category: "comment", label: "Comments", description: "Visible case conversations and follow-ups", emailDefault: false },
  { eventType: "USER_MENTIONED", category: "comment", label: "Mentions", description: "When a colleague mentions you directly", emailDefault: true },
  { eventType: "INFORMATION_REQUESTED", category: "information_request", label: "Information requests", description: "Requested documents, responses, and due dates", emailDefault: true },
  { eventType: "ANALYSIS_AWAITING_REVIEW", category: "review", label: "Reviews", description: "Review tasks, approvals, and rejections", emailDefault: true },
  { eventType: "REPORT_READY", category: "report", label: "Reports", description: "Generated and finalised reports", emailDefault: true },
  { eventType: "PASSWORD_CHANGED", category: "security", label: "Account security", description: "Mandatory account and security notices", emailDefault: true },
] as const;

function defaultPreference(definition: typeof definitions[number]): NotificationPreference {
  return {
    eventType: definition.eventType,
    category: definition.category,
    emailEnabled: definition.emailDefault,
    deliveryFrequency: "immediate",
    quietHoursEnabled: false,
    quietHoursStart: "20:00",
    quietHoursEnd: "07:00",
    timezone: "Africa/Johannesburg",
  };
}

export function NotificationPreferencesForm() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["notifications", "preferences"], queryFn: getPreferences });
  const [preferences, setPreferences] = useState<NotificationPreference[]>(definitions.map(defaultPreference));
  const mandatory = useMemo(() => new Set(query.data?.mandatoryEventTypes || []), [query.data]);

  useEffect(() => {
    if (!query.data) return;
    const saved = new Map(query.data.preferences.map((item) => [item.eventType, item]));
    setPreferences(definitions.map((definition) => saved.get(definition.eventType) || defaultPreference(definition)));
  }, [query.data]);

  const save = useMutation({
    mutationFn: () => updatePreferences(preferences),
    onSuccess: (result) => {
      queryClient.setQueryData(["notifications", "preferences"], result);
    },
  });
  const reset = useMutation({
    mutationFn: resetPreferences,
    onSuccess: (result) => {
      queryClient.setQueryData(["notifications", "preferences"], result);
      setPreferences(definitions.map(defaultPreference));
    },
  });

  const update = (eventType: string, patch: Partial<NotificationPreference>) => {
    setPreferences((items) => items.map((item) => item.eventType === eventType ? { ...item, ...patch } : item));
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-surface-line p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500"><Bell className="h-4 w-4" />Notification channels</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink-950">Choose what reaches your inbox</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">In-app notifications remain on for workflow continuity. Email and delivery timing can be adjusted where policy allows.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => reset.mutate()} isLoading={reset.isPending}><RotateCcw className="h-4 w-4" />Reset</Button>
          <Button onClick={() => save.mutate()} isLoading={save.isPending}><Save className="h-4 w-4" />Save preferences</Button>
        </div>
      </div>

      <div className="divide-y divide-surface-line">
        {definitions.map((definition) => {
          const preference = preferences.find((item) => item.eventType === definition.eventType) || defaultPreference(definition);
          const required = mandatory.has(definition.eventType);
          return (
            <div key={definition.eventType} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(240px,1fr)_150px_210px] lg:items-center">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-ink-600">
                  {required ? <ShieldCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-950">{definition.label}</h3>
                    {required ? <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Required</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{definition.description}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success-700"><Bell className="h-3.5 w-3.5" />In-app always on</p>
                </div>
              </div>
              <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-surface-line px-3 text-sm font-medium text-ink-700">
                <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-ink-400" />Email</span>
                <input type="checkbox" className="h-4 w-4 accent-ink-950" checked={required || preference.emailEnabled} disabled={required} onChange={(event) => update(definition.eventType, { emailEnabled: event.target.checked })} />
              </label>
              <label className="relative">
                <span className="sr-only">Delivery frequency for {definition.label}</span>
                <Clock3 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-400" />
                <select value={required ? "immediate" : preference.deliveryFrequency} disabled={required || !preference.emailEnabled} onChange={(event) => update(definition.eventType, { deliveryFrequency: event.target.value as NotificationPreference["deliveryFrequency"] })} className="min-h-11 w-full rounded-xl border border-surface-line bg-white pl-10 pr-3 text-sm font-medium text-ink-700 disabled:bg-surface-muted disabled:text-ink-400">
                  <option value="immediate">Immediate</option>
                  <option value="hourly_digest">Hourly digest</option>
                  <option value="daily_digest">Daily digest</option>
                  <option value="weekly_digest">Weekly digest</option>
                  <option value="in_app_only">In-app only</option>
                </select>
              </label>
            </div>
          );
        })}
      </div>
      {save.isSuccess ? <p className="border-t border-success-100 bg-success-50 px-6 py-3 text-sm font-medium text-success-700">Notification preferences saved.</p> : null}
      {save.isError ? <p className="border-t border-danger-100 bg-danger-50 px-6 py-3 text-sm font-medium text-danger-700">Preferences could not be saved. Please try again.</p> : null}
    </section>
  );
}
