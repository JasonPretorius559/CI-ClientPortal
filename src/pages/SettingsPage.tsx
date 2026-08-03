import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileImage, ShieldCheck, Trash2, Type } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { PageShell } from "../components/ui/PageShell";
import { useToast } from "../components/ui/toast-context";
import { updateReportPreferences } from "../features/auth/auth.api";
import { useAuth } from "../features/auth/useAuth";
import { NotificationPreferencesForm } from "../features/notifications/NotificationPreferencesForm";
import { supportedReportFonts } from "../features/reports/reportFonts";

const MAX_LOGO_BYTES = 750_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function currentReportPreferences(user: unknown) {
  const preferences = isRecord(user) && isRecord(user.reportPreferences)
    ? user.reportPreferences
    : {};
  return {
    fontFamily: typeof preferences.fontFamily === "string" ? preferences.fontFamily : "Arial",
    logoDataUrl: typeof preferences.logoDataUrl === "string" ? preferences.logoDataUrl : null,
  };
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Logo could not be read."));
    reader.onerror = () => reject(new Error("Logo could not be read."));
    reader.readAsDataURL(file);
  });
}

function ReportPreferencesCard() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const saved = currentReportPreferences(user);
  const [fontFamily, setFontFamily] = useState(saved.fontFamily);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(saved.logoDataUrl);
  const [logoName, setLogoName] = useState(saved.logoDataUrl ? "Saved custom logo" : "Default Cloud Insure logo");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    const next = currentReportPreferences(user);
    setFontFamily(next.fontFamily);
    setLogoDataUrl(next.logoDataUrl);
    setLogoName(next.logoDataUrl ? "Saved custom logo" : "Default Cloud Insure logo");
  }, [user]);

  const save = useMutation({
    mutationFn: () => updateReportPreferences({ fontFamily, logoDataUrl }),
    onSuccess: async () => {
      await refreshUser();
      showToast({ tone: "success", title: "Report branding saved." });
    },
    onError: () => showToast({ tone: "error", title: "Report branding could not be saved." }),
  });

  const selectLogo = async (file?: File) => {
    setFileError("");
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setFileError("Use a PNG or JPEG logo.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setFileError("Logo must be smaller than 750 KB.");
      return;
    }
    try {
      setLogoDataUrl(await readAsDataUrl(file));
      setLogoName(file.name);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Logo could not be read.");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="rounded-md border border-ink-200 bg-ink-100 p-3 text-ink-900">
            <FileImage className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink-950">Report branding</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              These defaults are applied automatically whenever you generate a report.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block text-sm font-medium text-ink-800">
            <span className="flex items-center gap-2"><Type className="h-4 w-4" />Report font</span>
            <select
              value={fontFamily}
              onChange={(event) => setFontFamily(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-surface-line bg-white px-3.5 text-sm text-ink-950 focus:border-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-100"
            >
              {supportedReportFonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
            <span className="mt-2 block text-xs leading-5 text-ink-500">The recipient must have the selected font installed for an exact match.</span>
          </label>

          <div>
            <p className="text-sm font-medium text-ink-800">Report logo</p>
            <div className="mt-2 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-ink-300 bg-surface-muted p-4">
              <img
                src={logoDataUrl ?? "/cloud_no_bg.png"}
                alt="Report logo preview"
                className="max-h-20 max-w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-800">{logoName}</p>
            <p className="mt-1 text-xs text-ink-500">PNG or JPEG, up to 750 KB.</p>
            {fileError ? <p className="mt-2 text-sm font-medium text-danger-700">{fileError}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {logoDataUrl ? (
              <Button type="button" variant="ghost" onClick={() => { setLogoDataUrl(null); setLogoName("Default Cloud Insure logo"); }}>
                <Trash2 className="h-4 w-4" />Use default
              </Button>
            ) : null}
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-ink-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-surface-muted">
              Choose logo
              <input type="file" accept="image/png,image/jpeg" hidden onChange={(event) => { void selectLogo(event.target.files?.[0]); event.currentTarget.value = ""; }} />
            </label>
            <Button type="button" onClick={() => save.mutate()} isLoading={save.isPending}>Save defaults</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <PageShell>
      <PageHeader title="Settings" description="Account, report, and notification preferences." />
      <ReportPreferencesCard />
      <NotificationPreferencesForm />
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
    </PageShell>
  );
}
