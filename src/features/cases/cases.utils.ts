type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, keys: string[]): string {
  if (!isRecord(value)) return "";
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (typeof candidate === "number") return String(candidate);
    if (isRecord(candidate)) {
      const nested = readString(candidate, ["name", "title", "label", "_id", "id"]);
      if (nested) return nested;
    }
  }
  return "";
}

function readDate(value: unknown, keys: string[]) {
  const candidate = readString(value, keys);
  return candidate || null;
}

function readArrayLength(value: unknown, keys: string[]) {
  if (!isRecord(value)) return null;
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate.length;
    if (typeof candidate === "number") return candidate;
  }
  return null;
}

export function getCaseId(caseItem: unknown): string {
  return readString(caseItem, ["CaseId", "caseId", "id", "_id"]);
}

export function getCaseTitle(caseItem: unknown): string {
  return readString(caseItem, ["caseTitle", "title", "CaseId", "caseId", "id", "_id"]) || "Untitled Case";
}

export function getCaseStatus(caseItem: unknown): string {
  return readString(caseItem, ["status", "caseStatus", "state", "Stage", "stage"]) || "open";
}

export function getCaseCreatedDate(caseItem: unknown): string | null {
  return readDate(caseItem, ["createdAt", "created_at", "createdDate", "dateCreated", "CreatedDate"]);
}

export function getCaseUpdatedDate(caseItem: unknown): string | null {
  return readDate(caseItem, ["updatedAt", "updated_at", "updatedDate", "lastUpdated", "ModifiedDate"]);
}

export function getCaseDescription(caseItem: unknown): string {
  return readString(caseItem, ["description", "caseDescription", "details", "summary"]);
}

export function getCaseFilesCount(caseItem: unknown): number | null {
  return readArrayLength(caseItem, ["files", "documents", "supportingDocuments", "attachments", "uploadedFiles", "filesCount", "documentsCount"]);
}

export function matchesCaseId(caseItem: unknown, id: string): boolean {
  if (!id) return false;
  const normalizedId = id.trim().toLowerCase();
  return ["_id", "id", "caseId", "CaseId"].some((key) => readString(caseItem, [key]).trim().toLowerCase() === normalizedId);
}

export function formatCaseStatus(status: string): string {
  if (!status) return "Open";
  return status
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function readCaseField(caseItem: unknown, keys: string[]) {
  if (!isRecord(caseItem)) return undefined;

  for (const key of keys) {
    const candidate = caseItem[key];

    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }

  return undefined;
}

export function readCaseDisplayField(
  caseItem: unknown,
  keys: string[],
): string | number | null {
  const value = readCaseField(caseItem, keys);

  if (typeof value === "string") return value;
  if (typeof value === "number") return value;

  return null;
}


export function getStatusGroup(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "resolved", "closed"].some((term) => normalized.includes(term))) return "completed";
  if (["needs", "action", "attention", "failed", "rejected"].some((term) => normalized.includes(term))) return "attention";
  if (["open", "pending", "processing", "in_progress", "in progress"].some((term) => normalized.includes(term))) return "open";
  return "other";
}
