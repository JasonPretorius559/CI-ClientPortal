import type { ReportTheme } from "../reports.types";

export function FontControls({
  theme,
  onChange,
}: {
  theme: ReportTheme;
  onChange: (theme: Partial<ReportTheme>) => void;
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-ink-700">Font family</span>
        <input
          value={theme.fontFamily}
          onChange={(event) => onChange({ fontFamily: event.target.value })}
          className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Body size</span>
          <input
            type="number"
            value={theme.bodyFontSize}
            onChange={(event) => onChange({ bodyFontSize: Number(event.target.value) })}
            className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Heading size</span>
          <input
            type="number"
            value={theme.headingFontSize}
            onChange={(event) => onChange({ headingFontSize: Number(event.target.value) })}
            className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Section title</span>
          <input
            type="number"
            value={theme.sectionTitleFontSize}
            onChange={(event) => onChange({ sectionTitleFontSize: Number(event.target.value) })}
            className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Line height</span>
          <input
            type="number"
            step="0.1"
            value={theme.lineHeight}
            onChange={(event) => onChange({ lineHeight: Number(event.target.value) })}
            className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Text color</span>
          <input
            type="color"
            value={theme.textColor}
            onChange={(event) => onChange({ textColor: event.target.value })}
            className="h-10 min-w-0 rounded-md border border-ink-300 bg-white px-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Accent</span>
          <input
            type="color"
            value={theme.accentColor}
            onChange={(event) => onChange({ accentColor: event.target.value })}
            className="h-10 min-w-0 rounded-md border border-ink-300 bg-white px-2"
          />
        </label>
      </div>
    </div>
  );
}
