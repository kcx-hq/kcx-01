import { apiGet } from "../../services/http";
import type { UploadListResponse, UploadItem } from "./operations.types";

export const fetchUploads = async (
  params: Record<string, string | number | undefined>
) => {
  return await apiGet<UploadListResponse>("/api/admin/operations/uploads", { query: params });
};

export const fetchUploadDetail = async (id: string) => {
  return await apiGet<UploadItem>(`/api/admin/operations/uploads/${id}`);
};
