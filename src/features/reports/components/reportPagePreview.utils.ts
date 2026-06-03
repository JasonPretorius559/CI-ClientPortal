import type { ReportTemplate } from "../reports.types";

export const PAGE_PREVIEW_WIDTH = 794;

export function getPagePreviewSize(template: ReportTemplate) {
  const portrait = template.page.orientation === "portrait";
  const ratio = template.page.size === "LETTER" ? 11 / 8.5 : 297 / 210;
  const width = PAGE_PREVIEW_WIDTH;
  const height = Math.round(width * ratio);
  return portrait ? { width, height } : { width, height: Math.round(width / ratio) };
}
