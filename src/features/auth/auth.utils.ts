function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeAuthUser(response: unknown): unknown | null {
  if (!isRecord(response)) return null;

  for (const key of ["user", "data", "account"]) {
    const value = response[key];
    if (isRecord(value)) return value;
  }

  return response;
}
