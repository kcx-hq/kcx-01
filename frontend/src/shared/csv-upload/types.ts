import type { CSSProperties } from "react";

export interface UploadTheme {
  pageShell: string;
  pageContainer: string;
  pageGrid: string;
  badge: string;
  card: string;
  panel: string;
  subPanel: string;
  input: string;
  primaryButton: string;
  secondaryButton: string;
  mutedText: string;
  strongText: string;
}

export interface DashboardUploadMeta {
  uploadId: string;
  filename: string;
}

export interface DashboardStoreSlice {
  uploadIds: string[];
  selectedUploads: DashboardUploadMeta[];
  dashboardPath: string;
  setUploadIds: (ids: string[]) => void;
  toggleUploadId: (id: string) => void;
  clearUploadIds: () => void;
  setSelectedUploads: (uploads: DashboardUploadMeta[]) => void;
}

export interface BillingUploadRecord {
  uploadid: string;
  filename: string;
  status?: string;
  clientid?: string;
  uploadedby?: string;
  billingperiodstart?: string;
  billingperiodend?: string;
  uploadedat?: string;
  filesize?: number | string | null;
}

export type UploadGridStyle = CSSProperties;

export interface CloudForm {
  accountId: string;
  roleName: string;
  bucketPrefix: string;
  region: string;
}

export interface CloudLatestFile {
  key?: string;
  lastModified?: string;
}

export interface CloudPreview {
  assumedRoleArn: string;
  bucket: string;
  prefix: string;
  latestFile: CloudLatestFile | null;
}

export interface CloudConnection extends CloudForm {
  rootPrefix: string;
  bucket: string;
}

export interface CloudFolderEntry {
  name: string;
  path: string;
}

export interface CloudFileEntry {
  name: string;
  path: string;
  size?: number | string | null;
  lastModified?: string;
}

export interface SelectedCloudFile {
  path: string;
  name: string;
  size: number | string | null;
  lastModified: string | null;
}
