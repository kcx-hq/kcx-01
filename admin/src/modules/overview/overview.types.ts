export type OverviewResponse = {
  users: { total: number; active: number; recent: number };
  inquiries: { total: number; pending: number; recent: number };
  systemStatus?: {
    level: string;
    message: string;
  };
  uploads: {
    total: number;
    byStatus: Record<string, number>;
    byStatusTotal?: number;
    statusMismatch?: boolean;
  };
  awsConnections?: {
    total: number;
    enabled: number;
    withErrors: number;
  };
  activity: Array<{
    type: string;
    entityId: string;
    timestamp: string;
    label?: string;
    status?: string;
    client?: string;
  }>;
  attention?: Array<{
    type: string;
    message: string;
    severity: "warning" | "critical";
    entityId?: string;
  }>;
  meta: {
    recentDays: number;
    activityLimit: number;
    generatedAt: string;
    warnings?: string[];
    cached?: boolean;
    scopeLabel?: string;
    lastRefreshedAt?: string;
    environment?: string;
  };
};
