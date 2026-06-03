import type { ReportCoverPage } from "../reports.types";

export function CoverPageSettingsPanel({
  coverPage,
  onChange,
}: {
  coverPage: ReportCoverPage;
  onChange: (coverPage: Partial<ReportCoverPage>) => void;
}) {
  return (
    <div className="grid gap-3">
      <label className="flex items-center gap-3 text-sm font-semibold text-ink-800">
        <input
          type="checkbox"
          checked={coverPage.enabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
          className="h-4 w-4 accent-ink-950"
        />
        Include cover page
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-ink-700">Cover title</span>
        <input
          value={coverPage.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-ink-700">Subtitle</span>
        <input
          value={coverPage.subtitle}
          onChange={(event) => onChange({ subtitle: event.target.value })}
          className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-ink-700">Cover background</span>
        <input
          type="color"
          value={coverPage.backgroundColor ?? "#f4f4f5"}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
          className="h-10 min-w-0 rounded-md border border-ink-300 bg-white px-2"
        />
      </label>
    </div>
  );
}
