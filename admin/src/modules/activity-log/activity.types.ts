export type AdminActivityLog = {
  id: string;
  admin_id: string;
  admin_email?: string | null;
  client_id?: string | null;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  correlation_id?: string | null;
  created_at: string;
};

export type AdminActivityFilters = {
  admins: Array<{ id: string; email: string }>;
  event_types: string[];
  entity_types: string[];
};

export type AdminActivityListResponse = {
  items: AdminActivityLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
