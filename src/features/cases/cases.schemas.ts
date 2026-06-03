import { z } from "zod";

const optionalEmail = z
  .string()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email address.");

const optionalDate = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Enter a valid date.");

export const createCaseSchema = z.object({
  caseTitle: z.string().min(1, "Case title is required."),
  caseTypeId: z.string().min(1, "Case type ID is required."),
  linkedCaseTypeId: z.string().min(1, "Linked case type ID is required."),
  entityTypeId: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  incidentDate: optionalDate,
  policyNumber: z.string().optional(),
  claimantFirstName: z.string().optional(),
  claimantLastName: z.string().optional(),
  claimantEmail: optionalEmail,
  claimantPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type CaseFileMetadata = {
  uploadSessionId: string;
  originalName: string;
  pathname: string;
  url?: string;
  mimeType: string;
  size: number;
};
export type CreateCaseInput = z.infer<typeof createCaseSchema> & {
  files?: CaseFileMetadata[];
};
