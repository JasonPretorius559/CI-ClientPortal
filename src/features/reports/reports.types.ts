import { z } from "zod";

export type ReportPageSettings = {
  size: "A4" | "LETTER";
  orientation: "portrait" | "landscape";
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  backgroundColor: string;
};

export type ReportTheme = {
  fontFamily: string;
  bodyFontSize: number;
  headingFontSize: number;
  sectionTitleFontSize: number;
  textColor: string;
  accentColor: string;
  lineHeight: number;
};

export type ReportElement = {
  id: string;
  type: "text" | "image" | "field" | "shape" | "table" | "repeater" | "conditional" | "pageBreak";
  label?: string;
  page: "cover" | string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked?: boolean;
  content?: string;
  fieldKey?: string;
  sourceKey?: string;
  path?: string;
  assetId?: string;
  columns?: Array<{
    id: string;
    label: string;
    path: string;
    fallback?: unknown;
    format?: string;
  }>;
  visibility?: {
    sourceKey?: string;
    path: string;
    operator: "exists" | "notEmpty" | "equals" | "notEquals" | "greaterThan" | "lessThan" | "includes";
    value?: unknown;
  };
  components?: ReportElement[];
  emptyState?: string;
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: "left" | "center" | "right";
    borderRadius?: number;
    objectFit?: "contain" | "cover" | "fill";
    opacity?: number;
  };
};

export type ReportCoverPage = {
  enabled: boolean;
  title: string;
  subtitle: string;
  backgroundColor?: string;
  backgroundAssetId?: string;
  elements: ReportElement[];
};

export type ReportSection = {
  id: string;
  type:
    | "executiveSummary"
    | "metrics"
    | "recommendations"
    | "missingInformation"
    | "documentWarnings"
    | "clientDetails"
    | "supportingDocuments"
    | "customText"
    | "rawAppendix";
  title: string;
  enabled: boolean;
  order: number;
  content?: string;
  style?: {
    headingFontSize?: number;
    bodyFontSize?: number;
  };
};

export type ReportAsset = {
  id?: string;
  _id?: string;
  templateId?: string;
  name?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  downloadUrl?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type ReportTemplate = {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isArchived?: boolean;
  version: number;
  page: ReportPageSettings;
  theme: ReportTheme;
  coverPage: ReportCoverPage;
  sections: ReportSection[];
  assets?: ReportAsset[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ReportPreviewData = {
  reportDate: string;
  caseReference: string;
  caseTitle: string;
  clientName: string;
  policyNumber?: string;
  confidenceScore?: number | null;
  satisfactionScore?: number | null;
  executiveSummary?: unknown;
  recommendations?: unknown[];
  missingInformation?: unknown[];
  documentWarnings?: unknown[];
  clientDetails?: unknown;
  supportingDocuments?: unknown[];
  rawAnalysis?: unknown;
  fields?: Record<string, unknown>;
  [key: string]: unknown;
};

export type GenerateReportRequest = {
  caseId: string;
  analysisId?: string;
  templateId?: string;
  template?: ReportTemplate;
  format: "pdf" | "docx";
};

export const reportPageSettingsSchema = z.object({
  size: z.enum(["A4", "LETTER"]),
  orientation: z.enum(["portrait", "landscape"]),
  marginTop: z.number().nonnegative(),
  marginRight: z.number().nonnegative(),
  marginBottom: z.number().nonnegative(),
  marginLeft: z.number().nonnegative(),
  backgroundColor: z.string().min(1),
});

export const reportThemeSchema = z.object({
  fontFamily: z.string().min(1),
  bodyFontSize: z.number().positive(),
  headingFontSize: z.number().positive(),
  sectionTitleFontSize: z.number().positive(),
  textColor: z.string().min(1),
  accentColor: z.string().min(1),
  lineHeight: z.number().positive(),
});

export const reportElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "image", "field", "shape", "table", "repeater", "conditional", "pageBreak"]),
  label: z.string().optional(),
  page: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  zIndex: z.number(),
  locked: z.boolean().optional(),
  content: z.string().optional(),
  fieldKey: z.string().optional(),
  sourceKey: z.string().optional(),
  path: z.string().optional(),
  assetId: z.string().optional(),
  columns: z.array(z.object({
    id: z.string(),
    label: z.string(),
    path: z.string(),
    fallback: z.unknown().optional(),
    format: z.string().optional(),
  })).optional(),
  visibility: z.object({
    sourceKey: z.string().optional(),
    path: z.string(),
    operator: z.enum(["exists", "notEmpty", "equals", "notEquals", "greaterThan", "lessThan", "includes"]),
    value: z.unknown().optional(),
  }).optional(),
  components: z.custom<ReportElement[]>().optional(),
  emptyState: z.string().optional(),
  style: z
    .object({
      fontFamily: z.string().optional(),
      fontSize: z.number().positive().optional(),
      fontWeight: z.string().optional(),
      color: z.string().optional(),
      backgroundColor: z.string().optional(),
      textAlign: z.enum(["left", "center", "right"]).optional(),
      borderRadius: z.number().nonnegative().optional(),
      objectFit: z.enum(["contain", "cover", "fill"]).optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .passthrough(),
});

export const reportSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "executiveSummary",
    "metrics",
    "recommendations",
    "missingInformation",
    "documentWarnings",
    "clientDetails",
    "supportingDocuments",
    "customText",
    "rawAppendix",
  ]),
  title: z.string().min(1),
  enabled: z.boolean(),
  order: z.number(),
  content: z.string().optional(),
  style: z
    .object({
      headingFontSize: z.number().positive().optional(),
      bodyFontSize: z.number().positive().optional(),
    })
    .passthrough()
    .optional(),
});

export const reportTemplateSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    name: z.string().min(1, "Template name is required."),
    description: z.string().optional(),
    isDefault: z.boolean(),
    isArchived: z.boolean().optional(),
    version: z.number(),
    page: reportPageSettingsSchema,
    theme: reportThemeSchema,
    coverPage: z
      .object({
        enabled: z.boolean(),
        title: z.string(),
        subtitle: z.string(),
        backgroundColor: z.string().optional(),
        backgroundAssetId: z.string().optional(),
        elements: z.array(reportElementSchema),
      })
      .passthrough(),
    sections: z.array(reportSectionSchema),
    assets: z.array(z.record(z.string(), z.unknown())).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export function getReportTemplateId(template: Pick<ReportTemplate, "id" | "_id">) {
  return template.id ?? template._id ?? "";
}

export function getReportAssetId(asset: Pick<ReportAsset, "id" | "_id">) {
  return asset.id ?? asset._id ?? "";
}
