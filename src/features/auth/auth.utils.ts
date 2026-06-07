function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, keys: string[]) {
  if (!isRecord(value)) return "";

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "";
}

export function normalizeAuthUser(response: unknown): unknown | null {
  if (!isRecord(response)) return null;

  for (const key of ["user", "data", "account"]) {
    const value = response[key];
    if (isRecord(value)) return value;
  }

  return response;
}

export function isAdminUser(user: unknown) {
  const role = readString(user, ["role"]).toLowerCase();
  if (role === "admin" || role.includes("admin")) return true;

  if (!isRecord(user) || !Array.isArray(user.roles)) return false;
  return user.roles.some((value) => typeof value === "string" && value.toLowerCase().includes("admin"));
}
