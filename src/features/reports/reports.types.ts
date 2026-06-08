export type GenerateReportRequest = {
  caseId: string;
  analysisId?: string;
};

export type ReportDownloadResponse = {
  blob: Blob;
  fileName: string;
};
