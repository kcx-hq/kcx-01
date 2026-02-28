import { API_BASE_URL } from "../../services/http";

export const signIn = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Login failed");
  }

  return res.json();
};

export const adminLogout = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/auth/logout`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Logout failed");
  }

  return res.json();
};

export const checkAdminHealth = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/health`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Forbidden");
  }

  return res.json();
};
