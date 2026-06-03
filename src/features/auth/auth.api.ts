import { apiFetch } from "../../lib/api";
import type { LoginInput, RegisterInput, SetPasswordInput } from "./auth.schemas";

export function login(values: LoginInput) {
  return apiFetch<unknown>("/api/auth/login", {
    method: "POST",
    body: values,
  });
}

export function logout() {
  return apiFetch<unknown>("/api/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return apiFetch<unknown>("/api/auth/me", {
    method: "GET",
    skipAuthRedirect: true,
  });
}

export function register(values: RegisterInput) {
  return apiFetch<unknown>("/api/auth/register", {
    method: "POST",
    body: values,
  });
}

export function forgotPassword(email: string) {
  return apiFetch<unknown>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function setPassword(values: SetPasswordInput) {
  return apiFetch<unknown>("/api/auth/set-password", {
    method: "POST",
    body: values,
  });
}
