export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readArrayFromPayload(payload: unknown, keys: string[] = []): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested: unknown[] = readArrayFromPayload(value, keys);
      if (nested.length > 0) return nested;
    }
  }

  if (isRecord(payload.data)) {
    const nested: unknown[] = readArrayFromPayload(payload.data, keys);
    if (nested.length > 0) return nested;
  }

  return [];
}

export function readObjectFromPayload(payload: unknown, keys: string[] = []) {
  if (!isRecord(payload)) return {};

  for (const key of keys) {
    const value = payload[key];
    if (isRecord(value)) return value;
  }

  if (isRecord(payload.data)) {
    for (const key of keys) {
      const value = payload.data[key];
      if (isRecord(value)) return value;
    }
    return payload.data;
  }

  return payload;
}

export function readString(record: unknown, keys: string[]) {
  if (!isRecord(record)) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

export function readNumber(record: unknown, keys: string[]) {
  if (!isRecord(record)) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export function readBoolean(record: unknown, keys: string[], fallback = false) {
  if (!isRecord(record)) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

export function getRecordId(record: unknown) {
  return readString(record, ["id", "_id"]);
}
