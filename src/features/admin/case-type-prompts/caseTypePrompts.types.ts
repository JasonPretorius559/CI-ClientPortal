export type CaseTypePrompt = {
  id?: string;
  _id?: string;
  caseType: string;
  caseTypeName?: string;
  linkedCaseType?: string | null;
  linkedCaseTypeName?: string;
  prompt: string;
  isActive: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SaveCaseTypePromptInput = {
  caseType?: string;
  linkedCaseType?: string | null;
  prompt: string;
  isActive: boolean;
};
