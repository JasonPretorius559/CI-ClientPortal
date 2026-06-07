import { getReportAssetUrl } from "../reports.api";
import { getReportAssetId, type ReportAsset, type ReportElement, type ReportPreviewData } from "../reports.types";

function getValueAtPath(source: unknown, path: string) {
  if (!path) return undefined;

  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function fieldValue(fieldKey: string | undefined, previewData: ReportPreviewData | null, fallback?: string) {
  if (!fieldKey) return "Select field";
  const value = previewData?.fields?.[fieldKey]
    ?? getValueAtPath(previewData?.fields ?? null, fieldKey)
    ?? getValueAtPath(previewData, fieldKey);
  if (value === null || value === undefined || value === "") return fallback || `{${fieldKey}}`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function rawFieldValue(fieldKey: string | undefined, previewData: ReportPreviewData | null) {
  if (!fieldKey) return undefined;
  return previewData?.fields?.[fieldKey]
    ?? getValueAtPath(previewData?.fields ?? null, fieldKey)
    ?? getValueAtPath(previewData, fieldKey);
}

function conditionMatches(element: ReportElement, previewData: ReportPreviewData | null) {
  const visibility = element.visibility;
  if (!visibility?.path) return true;
  const value = rawFieldValue(visibility.path, previewData);

  switch (visibility.operator) {
    case "exists":
      return value !== undefined && value !== null;
    case "notEmpty":
      return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
    case "equals":
      return String(value) === String(visibility.value ?? "");
    case "notEquals":
      return String(value) !== String(visibility.value ?? "");
    case "greaterThan":
      return Number(value) > Number(visibility.value);
    case "lessThan":
      return Number(value) < Number(visibility.value);
    case "includes":
      return Array.isArray(value) ? value.includes(visibility.value) : String(value ?? "").includes(String(visibility.value ?? ""));
    default:
      return true;
  }
}

export function ReportElementRenderer({
  element,
  assets,
  previewData,
}: {
  element: ReportElement;
  assets?: ReportAsset[];
  previewData: ReportPreviewData | null;
}) {
  const style = element.style;
  const sharedStyle = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    backgroundColor: style.backgroundColor,
    textAlign: style.textAlign,
    borderRadius: style.borderRadius,
    opacity: style.opacity,
  } as const;

  if (element.type === "shape") {
    return <div className="h-full w-full" style={sharedStyle} />;
  }

  if (element.type === "image") {
    const asset = assets?.find((item) => getReportAssetId(item) === element.assetId);
    const src = asset?.url ?? asset?.downloadUrl ?? (element.assetId ? getReportAssetUrl(element.assetId) : "");
    return src ? (
      <img
        src={src}
        alt={asset?.name ?? asset?.fileName ?? "Report asset"}
        className="h-full w-full"
        style={{ objectFit: style.objectFit ?? "contain", borderRadius: style.borderRadius, opacity: style.opacity }}
      />
    ) : (
      <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-ink-300 bg-ink-100 text-xs text-ink-500">
        Image
      </div>
    );
  }

  if (element.type === "table") {
    const rowsValue = rawFieldValue(element.path || element.fieldKey, previewData);
    const rows = Array.isArray(rowsValue) ? rowsValue : [];
    const columns: NonNullable<ReportElement["columns"]> = element.columns?.length ? element.columns : [{ id: "value", label: element.label || "Value", path: "" }];

    return (
      <div className="h-full w-full overflow-hidden rounded-md border border-ink-200 bg-white text-[10px]" style={sharedStyle}>
        <table className="min-w-full table-fixed border-collapse">
          <thead className="bg-ink-100">
            <tr>
              {columns.map((column) => <th key={column.id} className="border-b border-ink-200 px-2 py-1 text-left font-semibold">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.slice(0, 8).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.id} className="truncate border-b border-ink-100 px-2 py-1">
                    {column.path ? fieldValue(column.path, { ...((previewData ?? {}) as ReportPreviewData), fields: row as Record<string, unknown> }, String(column.fallback ?? "")) : JSON.stringify(row)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td className="px-2 py-2 text-ink-500" colSpan={columns.length}>{element.emptyState || "No records found"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (element.type === "repeater") {
    const value = rawFieldValue(element.path || element.fieldKey, previewData);
    const rows = Array.isArray(value) ? value : [];
    return (
      <div className="h-full w-full overflow-auto rounded-md border border-dashed border-ink-300 bg-white p-2 text-xs" style={sharedStyle}>
        <p className="font-semibold">{element.label || "Repeater"}</p>
        {rows.length ? rows.slice(0, 5).map((row, index) => <pre key={index} className="mt-1 whitespace-pre-wrap rounded bg-ink-50 p-1">{JSON.stringify(row, null, 2)}</pre>) : <p className="mt-1 text-ink-500">{element.emptyState || "No records found"}</p>}
      </div>
    );
  }

  if (element.type === "conditional") {
    const visible = conditionMatches(element, previewData);
    return (
      <div className="h-full w-full overflow-hidden rounded-md border border-dashed border-ink-300 bg-white p-2 text-xs" style={{ ...sharedStyle, opacity: visible ? style.opacity : 0.45 }}>
        <p className="font-semibold">{element.label || "Conditional block"}</p>
        <p className="mt-1 text-ink-500">{visible ? "Condition matched" : element.emptyState || "Hidden when condition is not met"}</p>
      </div>
    );
  }

  const content = element.type === "field" ? fieldValue(element.fieldKey, previewData, element.content) : element.content;

  return (
    <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words p-1 leading-tight" style={sharedStyle}>
      {content || "Text"}
    </div>
  );
}
