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

  const content = element.type === "field" ? fieldValue(element.fieldKey, previewData, element.content) : element.content;

  return (
    <div className="h-full w-full overflow-hidden whitespace-pre-wrap break-words p-1 leading-tight" style={sharedStyle}>
      {content || "Text"}
    </div>
  );
}
