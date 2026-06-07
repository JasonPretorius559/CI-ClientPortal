import type { ReportTemplate } from "../reports/reports.types";

export type StructuredOutputSchema = {
  key: string;
  name: string;
  description: string;
  version: number | null;
  isActive: boolean;
};

export type StructuredOutputSchemaField = {
  path: string;
  label: string;
  description: string;
  type: string;
  required: boolean;
  sourceKey?: string;
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

export type ReportDesignComponent = {
  id: string;
  type: string;
  label: string;
  fieldKey?: string;
  assetId?: string;
  page?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  locked?: boolean;
  content?: string;
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
  };
};

export type ReportDesignBinding = {
  componentId: string;
  sourceKey: string;
  path: string;
  fallback?: unknown;
};

export type ReportDesignDocument = {
  pages: unknown[];
  components: ReportDesignComponent[];
  template?: ReportTemplate;
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

export type ReportDesignGenerateResult =
  | {
      kind: "json";
      payload: unknown;
    }
  | {
      kind: "file";
      blob: Blob;
      fileName: string;
      contentType: string;
    };
