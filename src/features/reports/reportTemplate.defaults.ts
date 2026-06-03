import { nanoid } from "nanoid";
import type { ReportPreviewData, ReportSection, ReportTemplate } from "./reports.types";

export const builtInReportFields = [
  { key: "caseReference", label: "Case reference" },
  { key: "caseTitle", label: "Case title" },
  { key: "clientName", label: "Client name" },
  { key: "policyNumber", label: "Policy number" },
  { key: "reportDate", label: "Report date" },
  { key: "confidenceScore", label: "Confidence score" },
  { key: "satisfactionScore", label: "Satisfaction score" },
];

export function createDefaultSections(): ReportSection[] {
  return [
    { id: nanoid(), type: "executiveSummary", title: "Executive Summary", enabled: true, order: 1 },
    { id: nanoid(), type: "metrics", title: "Scores / Metrics", enabled: true, order: 2 },
    { id: nanoid(), type: "recommendations", title: "Recommendations", enabled: true, order: 3 },
    { id: nanoid(), type: "missingInformation", title: "Missing Information", enabled: true, order: 4 },
    { id: nanoid(), type: "documentWarnings", title: "Document Warnings", enabled: true, order: 5 },
    { id: nanoid(), type: "clientDetails", title: "Client Details", enabled: true, order: 6 },
    { id: nanoid(), type: "supportingDocuments", title: "Supporting Documents", enabled: true, order: 7 },
    { id: nanoid(), type: "rawAppendix", title: "Appendix / Raw Analysis", enabled: false, order: 8 },
  ];
}

export function createDefaultReportTemplate(): ReportTemplate {
  return {
    name: "Cloud Insure Analysis Report",
    description: "Reusable template for case analysis reports.",
    isDefault: false,
    isArchived: false,
    version: 1,
    page: {
      size: "A4",
      orientation: "portrait",
      marginTop: 56,
      marginRight: 48,
      marginBottom: 56,
      marginLeft: 48,
      backgroundColor: "#ffffff",
    },
    theme: {
      fontFamily: "Inter, Arial, sans-serif",
      bodyFontSize: 13,
      headingFontSize: 30,
      sectionTitleFontSize: 18,
      textColor: "#18181b",
      accentColor: "#0a0a0a",
      lineHeight: 1.5,
    },
    coverPage: {
      enabled: true,
      title: "Cloud Insure Report",
      subtitle: "Case analysis and recommendations",
      backgroundColor: "#f4f4f5",
      elements: [
        {
          id: nanoid(),
          type: "text",
          page: "cover",
          x: 64,
          y: 92,
          width: 420,
          height: 70,
          zIndex: 1,
          content: "Cloud Insure Report",
          style: {
            fontSize: 34,
            fontWeight: "700",
            color: "#0a0a0a",
            textAlign: "left",
          },
        },
        {
          id: nanoid(),
          type: "field",
          page: "cover",
          x: 64,
          y: 178,
          width: 280,
          height: 34,
          zIndex: 2,
          fieldKey: "caseReference",
          style: {
            fontSize: 15,
            fontWeight: "600",
            color: "#52525b",
            textAlign: "left",
          },
        },
      ],
    },
    sections: createDefaultSections(),
    assets: [],
  };
}

export const sampleReportPreviewData: ReportPreviewData = {
  reportDate: new Date().toLocaleDateString(),
  caseReference: "CI-CASE-2026-001284",
  caseTitle: "Personal Policy Claim Review",
  clientName: "Jordan Avery",
  policyNumber: "POL-8492-ALPHA",
  confidenceScore: 0.91,
  satisfactionScore: 4.35,
  executiveSummary:
    "The claim appears broadly aligned with policy coverage, with a few outstanding documents required before final determination.",
  recommendations: [
    "Request the final repair invoice and proof of payment.",
    "Confirm that the incident date is inside the active policy period.",
    "Proceed with assessor review once missing documents are supplied.",
  ],
  missingInformation: ["Repair invoice", "Incident photographs", "Signed client declaration"],
  documentWarnings: ["Uploaded proof of address is older than 90 days."],
  clientDetails: {
    name: "Jordan Avery",
    email: "jordan.avery@example.com",
    phone: "+27 82 000 0000",
  },
  supportingDocuments: ["Policy schedule.pdf", "Claim form.pdf", "Assessor notes.pdf"],
  rawAnalysis: {
    status: "completed",
    signals: ["coverage_match", "minor_document_gap"],
  },
  fields: {
    caseReference: "CI-CASE-2026-001284",
    caseTitle: "Personal Policy Claim Review",
    clientName: "Jordan Avery",
    policyNumber: "POL-8492-ALPHA",
    reportDate: new Date().toLocaleDateString(),
    confidenceScore: "91.0%",
    satisfactionScore: "4.35 / 5",
  },
};
