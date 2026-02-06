// src/components/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  X,
  LogOut,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../../store/Authstore";

const Header = ({ title, anomalies = [], anomaliesCount = 0 }) => {
  const navigate = useNavigate();
  const { logout, user, updateProfile, fetchUser } = useAuthStore();

  const [showDialog, setShowDialog] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [visibleAnomaliesCount, setVisibleAnomaliesCount] = useState(5);
  const [fullName, setFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const profileMenuRef = useRef(null);

  const hasAnomalies = anomaliesCount > 0;
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  // Initialize form with user data
  useEffect(() => {
    if (showProfileSettings && user) {
      setFullName(user.full_name || "");
      setUpdateError("");
    }
  }, [showProfileSettings, user]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/sign-in");
    }
  };

  const handleUpdateProfile = async (e) => {
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
      setShowProfileSettings(false);
      setShowProfileMenu(false);
      await fetchUser();
    } else {
      setUpdateError(result.message || "Failed to update profile");
    }

    setIsUpdating(false);
  };

  const handleDialogToggle = (open) => {
    setShowDialog(open);
    if (!open) setVisibleAnomaliesCount(5);
  };

  // ✅ theme tokens (no glow / no gradients)
  const BRAND = "var(--brand-secondary, #007758)";

  return (
    <>
      <header
        className="fixed top-0 left-[72px] lg:left-[240px] right-0 h-[64px] border-b border-white/10 z-[80] flex items-center px-4 lg:px-6 justify-between transition-all duration-300"
        style={{ backgroundColor: BRAND }}
      >
        {/* Left: Title */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-medium uppercase tracking-wider mb-0.5">
            <span className="cursor-pointer hover:text-white">K&Co.</span>
            <span className="opacity-70">/</span>
            <span className="text-white">Dashboard</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Status Indicators (kept, but no glow) */}
          <div className="flex items-center gap-2">
            {hasAnomalies ? (
              <button
                onClick={() => handleDialogToggle(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border border-white/20 rounded-lg hover:bg-black/30 transition-all"
              >
                <AlertTriangle size={14} className="text-amber-300" />
                <span className="text-xs font-semibold text-white">
                  Anomalies
                </span>
                <span className="text-[10px] bg-black/25 text-white px-1.5 py-0.5 rounded font-bold">
                  {anomaliesCount}
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleDialogToggle(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border border-white/20 rounded-lg hover:bg-black/30 transition-all"
              >
                <CheckCircle2 size={14} className="text-emerald-300" />
                <span className="text-xs font-semibold text-white">
                  Smooth
                </span>
              </button>
            )}
          </div>

          {/* User Profile */}
          <div className="pl-2 border-l border-white/20 ml-1 relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="group flex items-center gap-2 p-1 rounded-full hover:bg-black/20 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-black/25 border border-white/20 flex items-center justify-center text-white font-bold text-xs">
                {user?.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user?.email
                    ? user.email.charAt(0).toUpperCase()
                    : "KC"}
              </div>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white">
                  {user?.full_name || user?.email || "Client Admin"}
                </div>
              </div>

              <ChevronDown
                size={12}
                className={`text-white/70 group-hover:text-white transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence mode="wait">
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#121214] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/25 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                        {user?.full_name
                          ? user.full_name.charAt(0).toUpperCase()
                          : user?.email
                            ? user.email.charAt(0).toUpperCase()
                            : "KC"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {user?.full_name || user?.email || "Client Admin"}
                        </div>
                        <div className="text-xs text-white/60 truncate">
                          {user?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileSettings(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <User size={16} className="text-white/60" />
                      <span>Profile Settings</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} className="text-red-300" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Insights Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => handleDialogToggle(false)}
        >
          <div
            className="bg-[#121214] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasAnomalies ? (
                  <>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <AlertTriangle size={20} className="text-amber-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Anomalies Detected
                      </h2>
                      <p className="text-xs text-white/60 mt-0.5">
                        {anomaliesCount} cost anomalies found requiring attention
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <CheckCircle2 size={20} className="text-emerald-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Smooth Operations
                      </h2>
                      <p className="text-xs text-white/60 mt-0.5">
                        No cost leakage detected. All costs are within expected ranges.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => handleDialogToggle(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
              {hasAnomalies ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/80 mb-4">
                    The following cost anomalies have been detected. These represent unusual cost spikes that may indicate inefficiencies or require investigation.
                  </p>

                  <div className="space-y-2">
                    {anomalies.slice(0, visibleAnomaliesCount).map((item, index) => (
                      <div
                        key={index}
                        className="bg-black/20 border border-white/10 rounded-lg p-3 hover:bg-black/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold text-white truncate"
                              title={item.ServiceName || "Unknown Service"}
                            >
                              {item.ServiceName || "Unknown Service"}
                            </p>
                            <p
                              className="text-xs text-white/60 mt-1 truncate"
                              title={`${item.ProviderName || "N/A"} • ${item.RegionName || "N/A"}`}
                            >
                              {item.ProviderName || "N/A"} • {item.RegionName || "N/A"}
                            </p>
                            {item.ResourceId && (
                              <p
                                className="text-xs text-white/50 mt-1 truncate"
                                title={item.ResourceId}
                              >
                                Resource: {item.ResourceId}
                              </p>
                            )}
                          </div>

                          <div className="text-right ml-4 flex-shrink-0">
                            <p className="text-sm font-bold text-amber-300 whitespace-nowrap">
                              {formatCurrency(item.cost)}
                            </p>
                            {item.ChargePeriodStart && (
                              <p className="text-xs text-white/50 mt-1 whitespace-nowrap">
                                {item.ChargePeriodStart.split(" ")[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {anomalies.length > visibleAnomaliesCount ? (
                    <div className="flex justify-center pt-3">
                      <button
                        onClick={() => setVisibleAnomaliesCount(anomalies.length)}
                        className="px-4 py-2 bg-black/20 border border-white/10 hover:bg-black/30 rounded-lg text-xs font-semibold text-white/80 transition-colors"
                      >
                        Load More ({anomalies.length - visibleAnomaliesCount} remaining)
                      </button>
                    </div>
                  ) : visibleAnomaliesCount > 5 ? (
                    <div className="flex justify-center pt-3">
                      <button
                        onClick={() => setVisibleAnomaliesCount(5)}
                        className="px-4 py-2 bg-black/20 border border-white/10 hover:bg-black/30 rounded-lg text-xs font-semibold text-white/80 transition-colors"
                      >
                        Show Less
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="text-emerald-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-white mb-2">
                    All Systems Operating Smoothly
                  </p>
                  <p className="text-sm text-white/60">
                    Your cost management is optimal. No anomalies or cost leakage detected in the current dataset.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      <AnimatePresence>
        {showProfileSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <User size={20} className="text-white/80" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Profile Settings</h2>
                    <p className="text-xs text-white/60 mt-0.5">
                      Update your profile information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileSettings(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/25 border border-white/15 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-black/15 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-white/50 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {updateError && (
                  <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
                    <p className="text-xs text-red-300">{updateError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileSettings(false)}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND }}
                  >
                    {isUpdating ? "Updating..." : "Save Changes"}
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
