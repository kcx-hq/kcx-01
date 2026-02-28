import { API_BASE_URL, buildUrl } from "../../services/http";
import type { UsersListResponse } from "./users.types";

export const fetchUsers = async (params: Record<string, string | number | undefined>) => {
  const url = buildUrl("/admin/users", params);
  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load users");
  }

  return (await res.json()) as UsersListResponse;
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update status");
  }

  return res.json();
};

export const updateUserRole = async (id: string, role: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update role");
  }

  return res.json();
};

export const notifyUnverifiedUser = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/notify-unverified`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to notify user");
  }

  return res.json();
};

export const deleteUser = async (id: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete user");
  }

  return res.json();
};
