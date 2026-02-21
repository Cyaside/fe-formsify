export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

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
    const { startGlobalLoading } = await import("@/store/globalLoading");
    startGlobalLoading();
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
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
      const message =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message?: string }).message ?? response.statusText)
          : response.statusText;
      throw new ApiError(response.status, message);
    }

    return payload as T;
  } finally {
    if (shouldTrackLoading) {
      const { stopGlobalLoading } = await import("@/store/globalLoading");
      stopGlobalLoading();
    }
  }
}
