export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  skipAuthRedirect?: boolean;
};

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function statusMessage(status: number) {
  if (status === 400) return "Please check the submitted information.";
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "This action conflicts with the current state.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status >= 500) return "Something went wrong. Please try again or contact support.";
  return "Something went wrong. Please try again.";
}

function getPayloadMessage(payload: unknown) {
  if (!isPlainObject(payload)) return null;
  const candidate = (payload as ErrorPayload).message ?? (payload as ErrorPayload).error;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

async function parseResponse(response: Response) {
  if (response.status === 204 || response.status === 205) return null;

  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  return text;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { headers, body, skipAuthRedirect, ...rest } = options;
  void skipAuthRedirect;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | null | undefined = body as BodyInit | null | undefined;

  if (isPlainObject(body)) {
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
    requestBody = JSON.stringify(body);
  }

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Network error. Please check your connection and try again.", 0);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const payloadMessage = getPayloadMessage(payload);
    const safeMessage = response.status >= 500 ? statusMessage(response.status) : payloadMessage ?? statusMessage(response.status);
    const errors = isPlainObject(payload) ? (payload as ErrorPayload).errors ?? payload : payload;
    throw new ApiError(safeMessage, response.status, errors);
  }

  return payload as T;
}
