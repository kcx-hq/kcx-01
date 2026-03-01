import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../../../store/Authstore";
import { useDashboardStore } from "../../../store/Dashboard.store";

interface HeaderAnomaly {
  ServiceName?: string;
  ProviderName?: string;
  RegionName?: string;
  cost?: number;
  ChargePeriodStart?: string;
}

interface HeaderAlertItem {
  id: string;
  title: string;
  category: string;
  type: string;
  subtype: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  detectedAt: string;
  deepLink: string;
  scope: {
    provider: string;
    service: string;
    region: string;
    team: string;
  };
  impact: {
    amount: number;
    pct: number;
    currency: string;
  };
  nextStep: string;
}

interface HeaderAlertsData {
  totalOpenAlerts: number;
  categories: Array<{ id: string; label: string; count: number }>;
  topByCategory: Record<string, HeaderAlertItem[]>;
  topAlerts: HeaderAlertItem[];
  currency: string;
}

interface HeaderProps {
  title: string;
  anomalies?: HeaderAnomaly[];
  anomaliesCount?: number;
  headerAlerts?: HeaderAlertsData;
}

interface AlertPreferences {
  emailEnabled: boolean;
  recipientEmail: string;
  includeCritical: boolean;
  includeHigh: boolean;
  includeMedium: boolean;
}

const ALERT_PREFS_STORAGE_KEY = "kcx.dashboard.alert_preferences.v1";

const emptyHeaderAlerts: HeaderAlertsData = {
  totalOpenAlerts: 0,
  categories: [],
  topByCategory: {},
  topAlerts: [],
  currency: "USD",
};

const defaultAlertPrefs = (email: string): AlertPreferences => ({
  emailEnabled: true,
  recipientEmail: email,
  includeCritical: true,
  includeHigh: true,
  includeMedium: false,
});

const normalizeSeverity = (value: unknown): "critical" | "high" | "medium" | "low" => {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high" || v === "medium") return v;
  return "low";
};

const severityClass = (severity: "critical" | "high" | "medium" | "low"): string => {
  if (severity === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (severity === "high") return "border-amber-200 bg-amber-50 text-amber-700";
  if (severity === "medium") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const formatCurrency = (val: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val || 0);
  } catch {
    return `$${(val || 0).toFixed(2)}`;
  }
};

const Header = ({
  title,
  anomalies = [],
  anomaliesCount = 0,
  headerAlerts = emptyHeaderAlerts,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { logout, user, updateProfile, fetchUser } = useAuthStore();
  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const selectedUploads = useDashboardStore((s) => s.selectedUploads);

  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [selectedAlertCategory, setSelectedAlertCategory] = useState("all");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [alertPrefs, setAlertPrefs] = useState<AlertPreferences>(
    defaultAlertPrefs(user?.email || ""),
  );
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const sourceChipPalette = [
    "bg-emerald-50 border-emerald-200 text-emerald-800",
    "bg-cyan-50 border-cyan-200 text-cyan-800",
    "bg-blue-50 border-blue-200 text-blue-800",
    "bg-amber-50 border-amber-200 text-amber-800",
    "bg-lime-50 border-lime-200 text-lime-800",
  ];

  useEffect(() => {
    setFullName(user?.full_name || "");
  }, [user?.full_name]);

  useEffect(() => {
    const fallback = defaultAlertPrefs(user?.email || "");
    try {
      const raw = localStorage.getItem(ALERT_PREFS_STORAGE_KEY);
      if (!raw) {
        setAlertPrefs(fallback);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AlertPreferences>;
      setAlertPrefs({
        emailEnabled: parsed.emailEnabled ?? fallback.emailEnabled,
        recipientEmail: parsed.recipientEmail || fallback.recipientEmail,
        includeCritical: parsed.includeCritical ?? fallback.includeCritical,
        includeHigh: parsed.includeHigh ?? fallback.includeHigh,
        includeMedium: parsed.includeMedium ?? fallback.includeMedium,
      });
    } catch {
      setAlertPrefs(fallback);
    }
  }, [user?.email]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        event.target instanceof Node &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const activeSource = useMemo(() => {
    if (!uploadIds.length) {
      return { label: "", chips: [], remainingCount: 0, fullText: "" };
    }

    const selectedNames = uploadIds
      .map((id: string) => {
        const entry = selectedUploads.find((item) => item.uploadId === id);
        const filePath = entry?.filename || "";
        return filePath.split(/[\\/]/).pop();
      })
      .filter((name): name is string => Boolean(name));

    if (!selectedNames.length) {
      const fallback = `${uploadIds.length} files selected`;
      return {
        label: uploadIds.length === 1 ? "Source" : "Sources",
        chips: [fallback],
        remainingCount: 0,
        fullText: fallback,
      };
    }

    const visibleNames = selectedNames.slice(0, 3);
    const remainingCount = Math.max(0, selectedNames.length - visibleNames.length);

    return {
      label: uploadIds.length === 1 ? "Source" : "Sources",
      chips: visibleNames,
      remainingCount,
      fullText: selectedNames.join(", "),
    };
  }, [uploadIds, selectedUploads]);

  const activeSourceKey = useMemo(
    () => `${activeSource.label}:${activeSource.fullText}`,
    [activeSource.label, activeSource.fullText],
  );

  const normalizedHeaderAlerts = useMemo<HeaderAlertsData>(() => {
    const categories = Array.isArray(headerAlerts.categories)
      ? headerAlerts.categories.map((cat) => ({
          id: String(cat.id || "unknown"),
          label: String(cat.label || "Unknown"),
          count: Number(cat.count || 0),
        }))
      : [];

    const topAlerts = Array.isArray(headerAlerts.topAlerts)
      ? headerAlerts.topAlerts.map((alert) => ({
          ...alert,
          severity: normalizeSeverity(alert.severity),
        }))
      : [];

    const topByCategory =
      headerAlerts.topByCategory && typeof headerAlerts.topByCategory === "object"
        ? Object.fromEntries(
            Object.entries(headerAlerts.topByCategory).map(([key, value]) => [
              key,
              Array.isArray(value)
                ? value.map((alert) => ({
                    ...alert,
                    severity: normalizeSeverity(alert.severity),
                  }))
                : [],
            ]),
          )
        : {};

    return {
      totalOpenAlerts: Number(headerAlerts.totalOpenAlerts || 0),
      categories,
      topByCategory,
      topAlerts,
      currency: headerAlerts.currency || "USD",
    };
  }, [headerAlerts]);

  const hasStructuredHeaderAlerts = useMemo(
    () =>
      normalizedHeaderAlerts.totalOpenAlerts > 0 ||
      normalizedHeaderAlerts.categories.length > 0 ||
      normalizedHeaderAlerts.topAlerts.length > 0 ||
      Object.keys(normalizedHeaderAlerts.topByCategory || {}).length > 0,
    [
      normalizedHeaderAlerts.totalOpenAlerts,
      normalizedHeaderAlerts.categories.length,
      normalizedHeaderAlerts.topAlerts.length,
      normalizedHeaderAlerts.topByCategory,
    ],
  );

  const anomalyFallbackAlerts = useMemo<HeaderAlertItem[]>(
    () =>
      anomalies.slice(0, 10).map((item, index) => ({
        id: `fallback-anomaly-${index + 1}`,
        title: `${item.ServiceName || "Unknown Service"} - anomaly`,
        category: "spend",
        type: "spend_anomaly",
        subtype: "cost_spike",
        severity: "high",
        status: "new",
        detectedAt: item.ChargePeriodStart || "",
        deepLink: "/dashboard/cost-analysis",
        scope: {
          provider: item.ProviderName || "All",
          service: item.ServiceName || "Unknown Service",
          region: item.RegionName || "All",
          team: "Unassigned",
        },
        impact: {
          amount: Number(item.cost || 0),
          pct: 0,
          currency: normalizedHeaderAlerts.currency || "USD",
        },
        nextStep: "Open Cost Analysis for anomaly validation and mitigation.",
      })),
    [anomalies, normalizedHeaderAlerts.currency],
  );

  const categories = useMemo(() => {
    if (hasStructuredHeaderAlerts) return normalizedHeaderAlerts.categories;
    if (anomalyFallbackAlerts.length) {
      return [{ id: "spend", label: "Spend Intelligence", count: anomalyFallbackAlerts.length }];
    }
    return [];
  }, [hasStructuredHeaderAlerts, normalizedHeaderAlerts.categories, anomalyFallbackAlerts.length]);

  const totalOpenAlerts = useMemo(() => {
    if (hasStructuredHeaderAlerts) return normalizedHeaderAlerts.totalOpenAlerts;
    if (anomalyFallbackAlerts.length > 0) return anomalyFallbackAlerts.length;
    return Number(anomaliesCount || 0);
  }, [
    hasStructuredHeaderAlerts,
    normalizedHeaderAlerts.totalOpenAlerts,
    anomalyFallbackAlerts.length,
    anomaliesCount,
  ]);

  const visibleAlerts = useMemo(() => {
    if (selectedAlertCategory === "all") {
      if (hasStructuredHeaderAlerts) return normalizedHeaderAlerts.topAlerts;
      return anomalyFallbackAlerts;
    }
    if (hasStructuredHeaderAlerts) {
      const mapped = normalizedHeaderAlerts.topByCategory[selectedAlertCategory];
      if (Array.isArray(mapped)) return mapped;
      return [];
    }
    if (selectedAlertCategory === "spend") return anomalyFallbackAlerts;
    return [];
  }, [
    hasStructuredHeaderAlerts,
    selectedAlertCategory,
    normalizedHeaderAlerts.topAlerts,
    normalizedHeaderAlerts.topByCategory,
    anomalyFallbackAlerts,
  ]);

  useEffect(() => {
    if (selectedAlertCategory === "all") return;
    if (categories.some((cat) => cat.id === selectedAlertCategory)) return;
    setSelectedAlertCategory("all");
  }, [categories, selectedAlertCategory]);

  const saveAlertPreferencesLocal = () => {
    localStorage.setItem(ALERT_PREFS_STORAGE_KEY, JSON.stringify(alertPrefs));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/sign-in");
    } catch {
      navigate("/sign-in");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError("");

    if (!fullName.trim()) {
      setUpdateError("Full name is required");
      setIsUpdating(false);
      return;
    }

    const result = await updateProfile({ full_name: fullName.trim() });

    if (result.success) {
      saveAlertPreferencesLocal();
      setShowProfileSettings(false);
      setShowProfileMenu(false);
      await fetchUser();
    } else {
      setUpdateError(result.message || "Failed to update profile");
    }
    setIsUpdating(false);
  };

  return (
    <>
      <header className="fixed left-[72px] right-0 top-0 z-[100] flex h-[64px] items-center justify-between border-b border-slate-200 bg-white px-3 transition-all duration-300 sm:px-4 md:px-6 lg:left-[240px]">
        <div className="min-w-0">
          <div className="mb-0.5 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:flex">
            <span className="cursor-pointer transition-colors hover:text-[var(--brand-primary)]">KCX</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Dashboard</span>
          </div>
          <h1 className="truncate text-base font-bold leading-none tracking-tight text-[#192630] sm:text-lg">
            {title}
          </h1>
        </div>

        <div className="hidden flex-1 justify-center px-4 md:flex">
          <AnimatePresence mode="wait">
            {activeSource.chips.length ? (
              <motion.div
                key={activeSourceKey}
                initial={{ opacity: 0, y: -6, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ y: -1 }}
                className="relative max-w-[480px] min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
              >
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#007758]/10 to-transparent"
                  animate={{ opacity: [0.1, 0.28, 0.1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <p className="relative flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  <motion.span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[#007758]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {activeSource.label}
                </p>
                <motion.div
                  key={activeSource.fullText}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.03 }}
                  className="relative mt-0.5 flex min-w-0 items-center gap-1.5"
                  title={activeSource.fullText}
                >
                  {activeSource.chips.map((name, idx) => {
                    const chipClass = sourceChipPalette[idx % sourceChipPalette.length];
                    return (
                      <motion.span
                        key={`${name}-${idx}`}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.04 }}
                        className={`inline-flex max-w-[140px] items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold ${chipClass}`}
                        title={name}
                      >
                        {name}
                      </motion.span>
                    );
                  })}
                  {activeSource.remainingCount > 0 ? (
                    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#007758]/30 bg-[#007758]/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      +{activeSource.remainingCount} more
                    </span>
                  ) : null}
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedAlertCategory("all");
              setShowAlertsPanel(true);
            }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              totalOpenAlerts > 0
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Bell size={14} />
            <span>Alerts</span>
            <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">{totalOpenAlerts}</span>
          </button>

          <div className="relative flex items-center gap-2" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 rounded-full border border-transparent p-1 pl-2 transition-all hover:border-slate-100 hover:bg-slate-50"
            >
              <div className="hidden text-right sm:block">
                <div className="text-xs font-bold text-[#192630]">{user?.full_name || "Admin User"}</div>
                <div className="text-[10px] font-medium text-slate-500">{user?.role || "Viewer"}</div>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#192630] to-[#2C3E50] text-xs font-bold text-white shadow-md ring-2 ring-white">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>

              <ChevronDown size={14} className="mr-1 text-slate-400" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full z-[110] mt-2 w-64 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
                >
                  <div className="border-b border-slate-50 bg-slate-50/50 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-[#192630]">{user?.email}</p>
                  </div>

                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileSettings(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#192630]"
                    >
                      <Settings size={16} /> Account Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileSettings(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#192630]"
                    >
                      <Bell size={16} /> Alert Preferences
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#192630]"
                    >
                      <ShieldCheck size={16} /> Security & Privacy
                    </button>
                  </div>

                  <div className="border-t border-slate-50 p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showAlertsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm"
            onClick={() => setShowAlertsPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl border p-2.5 ${
                      totalOpenAlerts > 0
                        ? "border-amber-200 bg-amber-50 text-amber-600"
                        : "border-emerald-200 bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {totalOpenAlerts > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#192630]">Global Alerts Inbox</h2>
                    <p className="text-xs text-slate-500">
                      {totalOpenAlerts > 0
                        ? `${totalOpenAlerts} open alerts across modules`
                        : "No open alerts for current scope"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlertsPanel(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="border-b border-slate-100 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAlertCategory("all")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedAlertCategory === "all"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    All ({totalOpenAlerts})
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedAlertCategory(cat.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        selectedAlertCategory === cat.id
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[58vh] overflow-y-auto p-4">
                {visibleAlerts.length ? (
                  <div className="space-y-3">
                    {visibleAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => {
                          setShowAlertsPanel(false);
                          navigate(alert.deepLink || "/dashboard/alerts-incidents");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#192630]">{alert.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {alert.scope.provider} | {alert.scope.service} | {alert.scope.region}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(
                              alert.severity,
                            )}`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
                          <p>
                            Impact: <span className="font-semibold">{formatCurrency(alert.impact.amount, alert.impact.currency)}</span>
                          </p>
                          <p>
                            Owner: <span className="font-semibold">{alert.scope.team}</span>
                          </p>
                          <p>
                            Status: <span className="font-semibold">{alert.status.replace(/_/g, " ")}</span>
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{alert.nextStep}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={28} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No alerts available for this category.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAlertsPanel(false);
                    navigate("/dashboard/alerts-incidents");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Open Alerts Inbox
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm"
            onClick={() => setShowProfileSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
                <h3 className="text-lg font-bold text-[#192630]">Profile & Alert Settings</h3>
                <button type="button" onClick={() => setShowProfileSettings(false)}>
                  <X size={20} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="max-h-[72vh] space-y-5 overflow-y-auto p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Full Name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-[#192630] outline-none transition-all focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)]"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email Address
                  </label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-500"
                  />
                </div>

                <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="text-sm font-bold text-[#192630]">Alert Notifications (UI Preview)</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Email dispatch will be connected in backend. This preference is saved locally for now.
                  </p>

                  <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={alertPrefs.emailEnabled}
                      onChange={(e) =>
                        setAlertPrefs((prev) => ({ ...prev, emailEnabled: e.target.checked }))
                      }
                    />
                    Enable email alerts
                  </label>

                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Alert Recipient Email
                    </label>
                    <input
                      value={alertPrefs.recipientEmail}
                      onChange={(e) =>
                        setAlertPrefs((prev) => ({ ...prev, recipientEmail: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-[#192630] outline-none transition-all focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)]"
                      placeholder="alerts@company.com"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={alertPrefs.includeCritical}
                        onChange={(e) =>
                          setAlertPrefs((prev) => ({ ...prev, includeCritical: e.target.checked }))
                        }
                      />
                      Critical
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={alertPrefs.includeHigh}
                        onChange={(e) =>
                          setAlertPrefs((prev) => ({ ...prev, includeHigh: e.target.checked }))
                        }
                      />
                      High
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={alertPrefs.includeMedium}
                        onChange={(e) =>
                          setAlertPrefs((prev) => ({ ...prev, includeMedium: e.target.checked }))
                        }
                      />
                      Medium
                    </label>
                  </div>
                </section>

                {updateError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                    <AlertTriangle size={16} /> {updateError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileSettings(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 rounded-xl bg-[var(--brand-primary)] py-2.5 font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;




