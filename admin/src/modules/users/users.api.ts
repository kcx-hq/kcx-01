import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/http";
import type { UsersListResponse } from "./users.types";

export const fetchUsers = async (params: Record<string, string | number | undefined>) => {
  return apiGet<UsersListResponse>("/api/admin/users", { query: params });
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  return apiPatch<{ id: string; is_active: boolean }>(
    `/api/admin/users/${id}/status`,
    { is_active: isActive },
  );
};

export const updateUserRole = async (id: string, role: string) => {
  return apiPatch<{ id: string; role: string }>(`/api/admin/users/${id}/role`, {
    role,
  });
};

export const notifyUnverifiedUser = async (id: string) => {
  return apiPost<{ message?: string }>(`/api/admin/users/${id}/notify-unverified`);
};

export const deleteUser = async (id: string, password: string) => {
  return apiDelete<{ message?: string }>(`/api/admin/users/${id}`, { password });
};
