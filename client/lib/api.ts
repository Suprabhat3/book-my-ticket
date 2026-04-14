const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  error: unknown;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type LoginData = {
  accessToken: string;
  user: AuthUser;
};

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let payload: ApiResponse<T>;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("Invalid server response");
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message || "Request failed");
  }

  return payload;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse<AuthUser>(response);
  if (!parsed.data) {
    throw new ApiError("Missing user data in response");
  }

  return parsed.data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginData> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const parsed = await parseResponse<LoginData>(response);
  if (!parsed.data) {
    throw new ApiError("Missing login data in response");
  }

  return parsed.data;
}

export async function logoutUser(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  await parseResponse<null>(response);
}

export async function refreshAccessToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const parsed = await parseResponse<{ accessToken: string }>(response);
  if (!parsed.data?.accessToken) {
    throw new ApiError("Missing refreshed access token");
  }

  return parsed.data.accessToken;
}
