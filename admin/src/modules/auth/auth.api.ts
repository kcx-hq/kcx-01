import { apiGet, apiPost } from "../../services/http";

export const signIn = async (email: string, password: string) => {
  return apiPost<{ message?: string; user?: { id: string; email: string } }>(
    "/api/admin/auth/signin",
    { email, password },
  );
};

export const adminLogout = async () => {
  return apiGet<{ message?: string }>("/api/admin/auth/logout");
};

export const checkAdminHealth = async () => {
  return apiGet<{ ok?: boolean }>("/api/admin/health");
};
