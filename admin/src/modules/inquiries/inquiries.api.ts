import { API_BASE_URL, buildUrl } from "../../services/http";
import type { InquiriesListResponse } from "./inquiries.types";

export const fetchInquiries = async (params: Record<string, string | number | undefined>) => {
  const url = buildUrl("/admin/inquiries", params);
  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load inquiries");
  }

  return (await res.json()) as InquiriesListResponse;
};

export const updateInquiryStatus = async (
  id: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "STANDBY" | "HANDLED" | "TRASHED",
  meetLink?: string
) => {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, meet_link: meetLink }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update inquiry");
  }

  return res.json();
};

export const bulkUpdateInquiries = async (ids: string[], status: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/bulk/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids, status }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update inquiries");
  }

  return res.json();
};

export const deleteInquiry = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete inquiry");
  }

  return res.json();
};

export const bulkDeleteInquiries = async (ids: string[]) => {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/bulk/remove`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete inquiries");
  }

  return res.json();
};

export const relayInquiry = async (id: string, payload: { severity: string; note?: string }) => {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to relay inquiry");
  }

  return res.json();
};
