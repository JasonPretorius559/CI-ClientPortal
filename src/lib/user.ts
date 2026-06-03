function readUserField(user: unknown, keys: string[]) {
  if (!user || typeof user !== "object" || Array.isArray(user)) return "";
  const record = user as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

export function getUserDisplayName(user: unknown) {
  const firstName = readUserField(user, ["firstName"]);
  const lastName = readUserField(user, ["lastName"]);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || readUserField(user, ["name", "fullName", "email"]) || "Your account";
}
