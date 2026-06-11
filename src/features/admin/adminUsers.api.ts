import { apiFetch } from "../../lib/api";
import { isRecord, readArrayFromPayload, readNumber, readObjectFromPayload, readString } from "./adminPayload.utils";

export type AdminUserRole = "admin" | "user";
export type AdminUserStatus = "active" | "inactive" | "suspended";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  analysisLimit?: number;
  analysisUsed?: number;
  analysisRemaining?: number;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUsersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminUsersListParams = {
  q?: string;
  role?: AdminUserRole | "";
  status?: AdminUserStatus | "";
  page?: number;
  limit?: number;
};

export type AdminUserCreatePayload = {
  name: string;
  email: string;
  password: string;
  role: AdminUserRole;
  status: AdminUserStatus;
};

export type AdminUserUpdatePayload = Partial<AdminUserCreatePayload>;

const listKeys = ["users", "items", "data"];
const objectKeys = ["user", "data"];

function readRole(value: unknown): AdminUserRole {
  const role = readString(value, ["role"]).toLowerCase();
  return role === "admin" ? "admin" : "user";
}

function readStatus(value: unknown): AdminUserStatus {
  const status = readString(value, ["status"]).toLowerCase();
  if (status === "inactive" || status === "suspended") return status;
  return "active";
}

function normalizeUser(value: unknown): AdminUser | null {
  if (!isRecord(value)) return null;

  const id = readString(value, ["id", "_id"]);
  const name = readString(value, ["name", "fullName"]);
  const email = readString(value, ["email"]);

  if (!id || !email) return null;

  return {
    id,
    name: name || email,
    email,
    role: readRole(value),
    status: readStatus(value),
    analysisLimit: readNumber(value, ["analysisLimit"]) ?? undefined,
    analysisUsed: readNumber(value, ["analysisUsed"]) ?? undefined,
    analysisRemaining: readNumber(value, ["analysisRemaining"]) ?? undefined,
    lastLoginAt: readString(value, ["lastLoginAt"]) || undefined,
    createdAt: readString(value, ["createdAt"]) || undefined,
    updatedAt: readString(value, ["updatedAt"]) || undefined,
  };
}

function normalizePagination(payload: unknown): AdminUsersPagination {
  const source = isRecord(payload) && isRecord(payload.data) ? payload.data.pagination : isRecord(payload) ? payload.pagination : null;
  const page = readNumber(source, ["page"]) ?? 1;
  const limit = readNumber(source, ["limit"]) ?? 20;
  const total = readNumber(source, ["total"]) ?? 0;
  const totalPages = readNumber(source, ["totalPages"]) ?? Math.max(Math.ceil(total / limit), 1);

  return { page, limit, total, totalPages };
}

function normalizeUserObject(payload: unknown): AdminUser {
  const user = normalizeUser(readObjectFromPayload(payload, objectKeys));
  if (!user) throw new Error("User response was not in the expected format.");
  return user;
}

function buildQuery(params: AdminUsersListParams) {
  const search = new URLSearchParams();

  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));

  return search.toString();
}

export async function listAdminUsers(params: AdminUsersListParams) {
  const response = await apiFetch<unknown>(`/api/admin/users?${buildQuery(params)}`, { method: "GET" });

  return {
    users: readArrayFromPayload(response, listKeys).map(normalizeUser).filter((user): user is AdminUser => Boolean(user)),
    pagination: normalizePagination(response),
  };
}

export async function createAdminUser(payload: AdminUserCreatePayload) {
  const response = await apiFetch<unknown>("/api/admin/users", { method: "POST", body: payload });
  return normalizeUserObject(response);
}

export async function updateAdminUser(id: string, payload: AdminUserUpdatePayload) {
  const response = await apiFetch<unknown>(`/api/admin/users/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
  return normalizeUserObject(response);
}

export async function deactivateAdminUser(id: string) {
  const response = await apiFetch<unknown>(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  return normalizeUserObject(response);
}
