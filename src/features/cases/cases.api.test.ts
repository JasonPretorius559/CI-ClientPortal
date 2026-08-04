import { describe, expect, it } from "vitest";
import { normalizeAnalysisVersionsResponse, normalizeCaseAnalysisTypesResponse } from "./cases.api";

describe("analysis version evidence normalization", () => {
  it("normalizes the production evidence explorer contract", () => {
    const result = normalizeAnalysisVersionsResponse({
      data: {
        versions: [
          {
            analysisId: "analysis-1",
            versionNumber: 3,
            status: "completed",
            linkedCaseType: {
              id: "record-of-advice",
              name: "Record of Advice",
              workflowType: "record_of_advice",
            },
            evidenceExplorer: {
              version: 1,
              available: true,
              coverage: 0.75,
              claimCount: 4,
              supportedClaimCount: 3,
              warnings: ["One source needs review."],
              issues: [
                {
                  code: "SOURCE_MISMATCH",
                  severity: "warning",
                  message: "A quote could not be matched exactly.",
                },
              ],
              documents: [{ fileName: "Policy.pdf", textLength: 9_000 }],
              claims: [
                {
                  id: "evidence-1",
                  category: "Cover",
                  finding: "Contents cover is present.",
                  quote: "Household contents cover",
                  sourceFileName: "Policy.pdf",
                  pageNumber: 4,
                  confidence: "high",
                  verified: true,
                  supported: true,
                },
              ],
            },
          },
        ],
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].linkedCaseType).toEqual({
      id: "record-of-advice",
      name: "Record of Advice",
      workflowType: "record_of_advice",
    });
    expect(result[0].evidenceExplorer).toMatchObject({
      available: true,
      coverage: 0.75,
      claimCount: 4,
      supportedClaimCount: 3,
      documents: [{ fileName: "Policy.pdf", textLength: 9_000 }],
      claims: [
        {
          id: "evidence-1",
          category: "Cover",
          finding: "Contents cover is present.",
          quote: "Household contents cover",
          sourceFileName: "Policy.pdf",
          pageNumber: 4,
          confidence: "high",
          verified: true,
          supported: true,
        },
      ],
    });
  });

  it("fails closed when the evidence payload is malformed", () => {
    const result = normalizeAnalysisVersionsResponse({
      versions: [
        {
          analysisId: "analysis-2",
          versionNumber: 1,
          evidenceExplorer: {
            version: 2,
            available: true,
            claims: [{ finding: "Missing ID" }],
          },
        },
      ],
    });

    expect(result[0].evidenceExplorer).toBeNull();
  });
});

describe("case analysis type normalization", () => {
  it("keeps per-type state, required questions, and blocking information", () => {
    const result = normalizeCaseAnalysisTypesResponse({
      data: {
        analysisTypes: [{
          id: "analysis-type-1",
          name: "Record of Advice",
          workflowType: "record_of_advice",
          status: "queued",
          latestVersionNumber: 2,
          canRun: false,
          blockedReason: "Another analysis is currently running",
          isActiveJob: true,
          intakeData: { review_scope: "renewal" },
          intakeFields: [{ key: "review_scope", label: "Review scope", type: "select", options: ["renewal", "claim"], required: true }],
        }],
      },
    });

    expect(result).toEqual([expect.objectContaining({
      id: "analysis-type-1",
      status: "queued",
      latestVersionNumber: 2,
      canRun: false,
      isActiveJob: true,
      intakeData: { review_scope: "renewal" },
      intakeFields: [expect.objectContaining({ key: "review_scope", required: true })],
    })]);
  });
});
