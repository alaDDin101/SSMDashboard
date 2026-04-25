import type { ImageUploadResponseDto } from "@/lib/types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setToken(token: string, expiresAt: string) {
  localStorage.setItem("accessToken", token);
  localStorage.setItem("tokenExpiresAt", expiresAt);
}

export function clearToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("tokenExpiresAt");
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  const exp = localStorage.getItem("tokenExpiresAt");
  if (exp && new Date(exp) < new Date()) {
    clearToken();
    return false;
  }
  return true;
}

function splitPermissionString(s: string): string[] {
  const t = s.trim();
  if (!t) return [];
  if (t.startsWith("[") && t.endsWith("]")) {
    try {
      const parsed = JSON.parse(t) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string").flatMap(splitPermissionString);
      }
    } catch {
      /* fall through */
    }
  }
  if (t.includes(",") || t.includes(";")) {
    return t
      .split(/[,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [t];
}

function normalizePermissionsRaw(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const x of raw) {
      if (typeof x === "string") out.push(...splitPermissionString(x));
    }
    return out;
  }
  if (typeof raw === "string") return splitPermissionString(raw);
  return [];
}

export function getPermissions(): string[] {
  const token = getToken();
  if (!token) return [];
  const payload = parseJwtPayload(token);
  if (!payload) return [];
  const candidates = [
    payload.permission,
    payload.permissions,
    payload.Permission,
    payload.Permissions,
    payload.perm,
  ];
  const merged: string[] = [];
  for (const c of candidates) merged.push(...normalizePermissionsRaw(c));
  if (merged.length) return [...new Set(merged)];

  const scope = payload.scope ?? payload.scp;
  if (typeof scope === "string" && scope.trim()) {
    return [...new Set(scope.trim().split(/\s+/).filter(Boolean))];
  }
  return [];
}

export function getUserInfo() {
  const token = getToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  const rolesRaw = payload.roles ?? payload.role;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.filter((x): x is string => typeof x === "string") : typeof rolesRaw === "string" ? [rolesRaw] : [];
  return { email: email || sub, roles };
}

export function hasPermission(perm: string): boolean {
  return getPermissions().includes(perm);
}

/** JWT `sub` / NameIdentifier — for comparing current user (e.g. delete self). */
export function getUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (typeof payload.sub === "string") return payload.sub;
  const nameId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
  if (typeof nameId === "string") return nameId;
  if (typeof payload.userId === "string") return payload.userId;
  return null;
}

function dashboardUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return `/api/dashboard/v1${p}`;
  if (API_BASE.startsWith("http://") || API_BASE.startsWith("https://")) {
    return `${API_BASE}/api/dashboard/v1${p}`;
  }
  return `${API_BASE}/api/dashboard/v1${p}`;
}

/** Root-relative paths from the API (e.g. `/uploads/...`) → absolute URL for `<img src>` in the dashboard. */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  const p = path.trim();
  if (/^https?:\/\//i.test(p)) return p;
  const base =
    API_BASE && (API_BASE.startsWith("http://") || API_BASE.startsWith("https://"))
      ? API_BASE.replace(/\/$/, "")
      : typeof window !== "undefined"
        ? window.location.origin
        : "";
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
  const url = new URL(dashboardUrl(path), window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    });
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isLoginFailure = method === "POST" && path === "/auth/login" && res.status === 401;

  if (res.status === 401) {
    if (!isLoginFailure) {
      clearToken();
      window.location.href = "/login";
    }
    throw new Error(isLoginFailure ? "بيانات الدخول غير صحيحة" : "غير مصرح");
  }
  if (res.status === 403) throw new Error("ليس لديك صلاحية لهذا الإجراء");
  if (res.status === 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "غير موجود");
  }
  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "خطأ في البيانات");
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error("حدث خطأ غير متوقع");
  return res.json();
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const url = new URL(dashboardUrl(path), window.location.origin);
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("غير مصرح");
  }
  if (res.status === 403) throw new Error("ليس لديك صلاحية لهذا الإجراء");
  if (res.status === 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "غير موجود");
  }
  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "خطأ في البيانات");
  }
  if (!res.ok) throw new Error("حدث خطأ غير متوقع");
  return res.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) => request<T>("GET", path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return requestFormData<ImageUploadResponseDto>("/media/upload", fd);
  },
};
