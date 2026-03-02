export type UploadItem = {
  uploadid: string;
  filename?: string | null;
  filesize?: number | null;
  uploadedat?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  billingperiodstart?: string | null;
  billingperiodend?: string | null;
  client?: {
    id: string;
    name: string;
  } | null;
  uploadedBy?: {
    id: string;
    full_name: string;
  } | null;
};

export type UploadListResponse = {
  items: UploadItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
