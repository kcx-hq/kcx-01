import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  X,
  LogOut,
  User,
  Settings,
  Bell,
  ShieldCheck
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

  useEffect(() => {
    if (showProfileSettings && user) {
      setFullName(user.full_name || "");
      setUpdateError("");
    }
  }, [showProfileSettings, user]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
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

  return (
    <>
      {/* Z-INDEX FIX: 
         Increased z-index to 100 to ensure the profile menu drops OVER 
         any dashboard filters or sticky content below.
      */}
      <header className="fixed top-0 left-[72px] lg:left-[240px] right-0 h-[64px] bg-white border-b border-slate-200 z-[100] flex items-center px-3 sm:px-4 md:px-6 justify-between transition-all duration-300">
        
        {/* === LEFT: BREADCRUMBS & TITLE === */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            <span className="hover:text-[var(--brand-primary)] cursor-pointer transition-colors">KCX</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Dashboard</span>
          </div>
          <h1 className="truncate text-base sm:text-lg font-bold text-[#192630] tracking-tight leading-none">
            {title}
          </h1>
        </div>

        {/* === RIGHT: ACTIONS === */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* SEARCH BAR REMOVED */}

          {/* STATUS INDICATOR */}
          <button
            onClick={() => handleDialogToggle(true)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
              ${hasAnomalies 
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }
            `}
          >
            {hasAnomalies ? (
              <AlertTriangle size={16} fill="currentColor" className="text-amber-500" />
            ) : (
              <CheckCircle2 size={16} fill="currentColor" className="text-emerald-500" />
            )}
            <span className="hidden sm:inline text-xs font-bold">
              {hasAnomalies ? `${anomaliesCount} Issues` : "System Healthy"}
            </span>
          </button>

          {/* NOTIFICATIONS */}
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* USER PROFILE */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-1 pl-2 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-[#192630]">
                  {user?.full_name || "Admin User"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user?.role || "Viewer"}
                </div>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#192630] to-[#2C3E50] flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              
              <ChevronDown size={14} className="text-slate-400 mr-1" />
            </button>

            {/* DROPDOWN MENU */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-[110]"
                >
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-semibold text-[#192630] truncate">{user?.email}</p>
                  </div>
                  
                  <div className="p-1.5">
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowProfileSettings(true); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-[#192630] hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Settings size={16} /> Account Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-[#192630] hover:bg-slate-50 rounded-lg transition-colors">
                      <ShieldCheck size={16} /> Security & Privacy
                    </button>
                  </div>

                  <div className="border-t border-slate-50 p-1.5">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* === ANOMALIES DIALOG === */}
      <AnimatePresence>
        {showDialog && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={() => handleDialogToggle(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${hasAnomalies ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
                    {hasAnomalies ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#192630]">
                      {hasAnomalies ? "Anomalies Detected" : "System Healthy"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {hasAnomalies 
                        ? `${anomaliesCount} potential cost issues found.` 
                        : "No cost leakage detected in the current period."
                      }
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDialogToggle(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {hasAnomalies ? (
                  <div className="space-y-3">
                    {anomalies.slice(0, visibleAnomaliesCount).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                        <div>
                          <p className="font-semibold text-[#192630]">{item.ServiceName || "Unknown Service"}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.ProviderName} • {item.RegionName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-600">{formatCurrency(item.cost)}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{item.ChargePeriodStart?.split(" ")[0]}</p>
                        </div>
                      </div>
                    ))}
                    {anomalies.length > visibleAnomaliesCount && (
                      <button onClick={() => setVisibleAnomaliesCount(anomalies.length)} className="w-full py-3 text-sm text-[var(--brand-primary)] font-semibold hover:bg-slate-50 rounded-xl transition-colors">
                        View All Anomalies
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <p className="text-slate-600 font-medium">Everything looks good!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === PROFILE SETTINGS MODAL === */}
      <AnimatePresence>
        {showProfileSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            onClick={() => setShowProfileSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg text-[#192630]">Edit Profile</h3>
                <button onClick={() => setShowProfileSettings(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-[#192630] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)] outline-none transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    value={user?.email || ""}
                    disabled
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>

                {updateError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertTriangle size={16} /> {updateError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowProfileSettings(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={isUpdating} className="flex-1 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-bold shadow-lg shadow-[var(--brand-primary)]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                    {isUpdating ? "Saving..." : "Save Changes"}
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
