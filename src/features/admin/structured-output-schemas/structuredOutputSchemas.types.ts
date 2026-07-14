export type StructuredOutputSchemaStatus = "system";

export type StructuredOutputSchemaField = {
  path: string;
  label: string;
  type: string;
  array: boolean;
  required: boolean;
  description?: string;
};
export type StructuredOutputSchema = {
  id?: string;
  _id?: string;
  name: string;
  key: string;
  description?: string;
  version: number;
  caseType?: string;
  linkedCaseType?: string;
  caseTypeName?: string;
  linkedCaseTypeName?: string;
  caseTypeNameSnapshot?: string;
  linkedCaseTypeNameSnapshot?: string;
  status: StructuredOutputSchemaStatus;
  isActive: boolean;
  source?: "code";
  jsonSchema?: Record<string, unknown>;
  fields?: StructuredOutputSchemaField[];
  tree?: unknown[];
  systemPromptHint?: string;
  userPromptHint?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};
