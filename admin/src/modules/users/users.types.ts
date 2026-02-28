export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string | null;
  client_id?: string | null;
  is_active: boolean;
  is_verified: boolean;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type UsersListResponse = {
  items: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
