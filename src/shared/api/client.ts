const unwrapEnvString = (value: string | undefined) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export const API_BASE_URL =
  unwrapEnvString(process.env.NEXT_PUBLIC_API_BASE_URL) ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ValidationIssue = {
  path?: string;
  message?: string;
};

const formatFieldName = (path: string) => {
  const normalized = path.replace(/^body\./, "");
  const field = normalized.split(".")[0];
  if (field === "email") return "Email";
  if (field === "password") return "Password";
  if (field === "name") return "Name";
  return field.charAt(0).toUpperCase() + field.slice(1);
};

const buildApiErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as { message?: unknown; errors?: unknown };
  const baseMessage =
    typeof record.message === "string" && record.message.trim()
      ? record.message.trim()
      : fallback;

  if (!Array.isArray(record.errors) || record.errors.length === 0) {
    return baseMessage;
  }

  const firstIssue = record.errors.find(
    (item): item is ValidationIssue =>
      !!item && typeof item === "object" && ("message" in item || "path" in item),
  );

  if (!firstIssue || typeof firstIssue.message !== "string") {
    return baseMessage;
  }

  if (typeof firstIssue.path === "string" && firstIssue.path.startsWith("body.")) {
    return `${formatFieldName(firstIssue.path)}: ${firstIssue.message}`;
  }

  return firstIssue.message || baseMessage;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  body?: unknown;
  showGlobalLoading?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { showGlobalLoading, token, body, ...fetchOptions } = options;
  const shouldTrackLoading =
    showGlobalLoading === true && typeof window !== "undefined";
  if (shouldTrackLoading) {
    const { startGlobalLoading } = await import("@/shared/store/globalLoading");
    startGlobalLoading();
  }

  const url = path.startsWith("http")
    ? path
    : path.startsWith("/api/")
      ? path
      : `${API_BASE_URL}${path}`;
  const headers = new Headers(fetchOptions.headers);

  if (!headers.has("Content-Type") && body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: fetchOptions.credentials ?? "include",
      body:
        body === undefined
          ? undefined
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = buildApiErrorMessage(payload, response.statusText);
      throw new ApiError(response.status, message, payload);
    }

    return payload as T;
  } finally {
    if (shouldTrackLoading) {
      const { stopGlobalLoading } = await import("@/shared/store/globalLoading");
      stopGlobalLoading();
    }
  }
}
