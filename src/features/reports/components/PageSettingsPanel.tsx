import type { ReportPageSettings } from "../reports.types";

export function PageSettingsPanel({
  page,
  onChange,
}: {
  page: ReportPageSettings;
  onChange: (page: Partial<ReportPageSettings>) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Page size</span>
          <select value={page.size} onChange={(event) => onChange({ size: event.target.value as ReportPageSettings["size"] })} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
            <option value="A4">A4</option>
            <option value="LETTER">Letter</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-ink-700">Orientation</span>
          <select value={page.orientation} onChange={(event) => onChange({ orientation: event.target.value as ReportPageSettings["orientation"] })} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["marginTop", "marginRight", "marginBottom", "marginLeft"] as const).map((key) => (
          <label key={key} className="grid gap-1 text-sm">
            <span className="font-semibold text-ink-700">{key.replace("margin", "Margin ")}</span>
            <input
              type="number"
              value={page[key]}
              onChange={(event) => onChange({ [key]: Number(event.target.value) })}
              className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
            />
          </label>
        ))}
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-ink-700">Background</span>
        <input
          type="color"
          value={page.backgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
          className="h-10 min-w-0 rounded-md border border-ink-300 bg-white px-2"
        />
      </label>
    </div>
  );
}
