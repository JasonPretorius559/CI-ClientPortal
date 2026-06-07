import type { ReportTemplate } from "../reports/reports.types";

export type ReportDesignStatus = "draft" | "published" | "archived";

export type StructuredOutputSchema = {
  id?: string;
  _id?: string;
  key: string;
  name: string;
  description: string;
  version: number | null;
  status?: "draft" | "published" | "archived";
  isActive: boolean;
  source?: "admin" | "code";
  caseType?: string;
  linkedCaseType?: string;
  caseTypeName?: string;
  linkedCaseTypeName?: string;
  caseTypeNameSnapshot?: string;
  linkedCaseTypeNameSnapshot?: string;
};

export type StructuredOutputSchemaField = {
  path: string;
  label: string;
  description: string;
  type: string;
  array: boolean;
  required: boolean;
  sourceKey?: string;
  supportsTable?: boolean;
  supportsRepeater?: boolean;
};

export type ReportDataSource = {
  key: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type ReportDataSourceFieldsResult = {
  sourceKey: string;
  schemaVersion: number | null;
  fields: StructuredOutputSchemaField[];
  tree: unknown[];
  warnings: string[];
};

export type ReportDesignBinding = {
  componentId: string;
  sourceKey: string;
  path: string;
  fallback?: unknown;
};

export type ReportDesignComponent = {
  id: string;
  type: "text" | "field" | "image" | "shape" | "table" | "repeater" | "conditional" | "pageBreak" | string;
  label: string;
  fieldKey?: string;
  sourceKey?: string;
  path?: string;
  assetId?: string;
  page?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  locked?: boolean;
  content?: string;
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
  components?: ReportDesignComponent[];
  emptyState?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: "left" | "center" | "right";
    borderRadius?: number;
    objectFit?: "contain" | "cover" | "fill";
    opacity?: number;
    [key: string]: unknown;
  };
};

export type ReportDesignDocument = {
  version?: number;
  page?: {
    size?: "A4" | "Letter" | "LETTER";
    orientation?: "portrait" | "landscape";
    margin?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  theme?: Record<string, unknown>;
  pages: unknown[];
  components: ReportDesignComponent[];
  template?: ReportTemplate | unknown;
};

export type ReportDesign = {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  schemaKey: string;
  schemaVersion: number | null;
  design: ReportDesignDocument;
  bindings: ReportDesignBinding[];
  status?: ReportDesignStatus;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  hasMigratedBindings?: boolean;
  warnings?: string[];
};

export type SaveReportDesignInput = {
  name: string;
  description: string;
  schemaKey: string;
  schemaVersion: number;
  design: ReportDesignDocument;
  bindings: ReportDesignBinding[];
  isArchived?: boolean;
};

export type ReportDesignRunInput = {
  caseId: string;
  analysisId: string;
};

export type ReportRenderFormat = "json" | "html" | "pdf" | "docx";

export type ReportDesignRenderInput = ReportDesignRunInput & {
  format?: ReportRenderFormat;
  mode?: "preview" | "final";
};

export type ReportDesignGenerateResult =
  | {
      kind: "json";
      payload: unknown;
    }
  | {
      kind: "html";
      html: string;
    }
  | {
      kind: "file";
      blob: Blob;
      fileName: string;
      contentType: string;
    };
