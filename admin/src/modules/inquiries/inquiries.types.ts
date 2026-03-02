export type AdminInquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "STANDBY" | "HANDLED" | "TRASHED";
  meet_link?: string | null;
  preferred_datetime: string;
  timezone: string;
  activity_time: string;
  updated_at: string;
  action_token?: string | null;
  relay_severity?: string | null;
  relay_note?: string | null;
  relayed_at?: string | null;
  trashed_at?: string | null;
  handled_at?: string | null;
};

export type InquiriesListResponse = {
  items: AdminInquiry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
