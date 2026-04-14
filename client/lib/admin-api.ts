import { ApiError, refreshAccessToken } from "@/lib/api";
import { AdminModuleKey, getAdminModuleByKey } from "@/lib/admin-modules";
import { setAccessToken } from "@/lib/auth-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

type BackendResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  error: unknown;
};

function buildHeaders(accessToken: string | null) {
  if (!accessToken) {
    throw new ApiError("Access token missing. Please login again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseBackendResponse<T>(response: Response): Promise<BackendResponse<T>> {
  let payload: BackendResponse<T>;
  try {
    payload = (await response.json()) as BackendResponse<T>;
  } catch {
    throw new ApiError("Invalid server response");
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message || "Request failed");
  }

  return payload;
}

async function requestWithAutoRefresh(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  let response = await fetch(input, { ...init, cache: "no-store" });

  if (response.status !== 401) {
    return response;
  }

  try {
    const newAccessToken = await refreshAccessToken();
    setAccessToken(newAccessToken);

    const nextHeaders = new Headers(init.headers);
    nextHeaders.set("Authorization", `Bearer ${newAccessToken}`);

    response = await fetch(input, {
      ...init,
      headers: nextHeaders,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    return response;
  }

  return response;
}

export async function fetchModuleItems(moduleKey: AdminModuleKey, accessToken: string | null) {
  const moduleConfig = getAdminModuleByKey(moduleKey);
  if (!moduleConfig) {
    throw new ApiError("Unknown admin module");
  }

  const response = await requestWithAutoRefresh(`${API_BASE_URL}${moduleConfig.path}`, {
    method: "GET",
    headers: buildHeaders(accessToken),
    credentials: "include",
  });

  const payload = await parseBackendResponse<unknown>(response);
  return payload.data;
}

export async function createModuleItem(
  moduleKey: AdminModuleKey,
  accessToken: string | null,
  body: Record<string, unknown>,
) {
  const moduleConfig = getAdminModuleByKey(moduleKey);
  if (!moduleConfig) {
    throw new ApiError("Unknown admin module");
  }

  if (!moduleConfig.createEnabled) {
    throw new ApiError("Create action is not enabled for this module");
  }

  const response = await requestWithAutoRefresh(`${API_BASE_URL}${moduleConfig.path}`, {
    method: "POST",
    headers: buildHeaders(accessToken),
    credentials: "include",
    body: JSON.stringify(body),
  });

  const payload = await parseBackendResponse<unknown>(response);
  return payload.data;
}
