import { Bell, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account and security preferences." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex gap-4">
              <div className="rounded-md border border-ink-200 bg-ink-100 p-3 text-ink-900">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink-950">Account security</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">Security controls will appear here when user-facing backend endpoints are available.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex gap-4">
              <div className="rounded-md border border-ink-200 bg-ink-100 p-3 text-ink-900">
                <Bell className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink-950">Notifications</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">Case notification preferences are not editable from this portal yet.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
          <div className="flex gap-4">
            <div className="rounded-md border border-ink-200 bg-ink-100 p-3 text-ink-900">
              <SlidersHorizontal className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-950">Preferences</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">Display and portal preferences will be added when supported by the backend.</p>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
