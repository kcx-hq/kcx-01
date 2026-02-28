import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/http";
import type { InquiriesListResponse } from "./inquiries.types";

export const fetchInquiries = async (params: Record<string, string | number | undefined>) => {
  return apiGet<InquiriesListResponse>("/api/admin/inquiries", { query: params });
};

export const updateInquiryStatus = async (
  id: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "STANDBY" | "HANDLED" | "TRASHED",
  meetLink?: string
) => {
  return apiPatch<{ id: string; status: string; meet_link?: string | null }>(
    `/api/admin/inquiries/${id}/status`,
    { status, meet_link: meetLink },
  );
};

export const bulkUpdateInquiries = async (ids: string[], status: string) => {
  return apiPatch<{ updated: number }>("/api/admin/inquiries/bulk/status", {
    ids,
    status,
  });
};

export const deleteInquiry = async (id: string) => {
  return apiDelete<{ ok?: boolean }>(`/api/admin/inquiries/${id}`);
};

export const bulkDeleteInquiries = async (ids: string[]) => {
  return apiDelete<{ deleted: number }>("/api/admin/inquiries/bulk/remove", {
    ids,
  });
};

export const relayInquiry = async (id: string, payload: { severity: string; note?: string }) => {
  return apiPost<{ message?: string }>(`/api/admin/inquiries/${id}/relay`, payload);
};
