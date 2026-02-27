// src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronDown, CheckCircle2, AlertTriangle, X, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/Authstore';

interface AnomalyItem {
  ServiceName?: string;
  ProviderName?: string;
  RegionName?: string;
  ResourceId?: string;
  cost?: number;
  ChargePeriodStart?: string;
}

interface HeaderProps {
  title: string;
  anomalies?: AnomalyItem[];
  anomaliesCount?: number;
}

const Header = ({ title, anomalies = [], anomaliesCount = 0 }: HeaderProps) => {
  const navigate = useNavigate();
  const { logout, user, updateProfile, fetchUser } = useAuthStore();
  const [showDialog, setShowDialog] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [visibleAnomaliesCount, setVisibleAnomaliesCount] = useState(5);
  const [fullName, setFullName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const hasAnomalies = anomaliesCount > 0;
  const formatCurrency = (val: number | string | null | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val ?? 0));

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && event.target instanceof Node && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/sign-in');
    } catch (error: unknown) {
      console.error('Logout failed:', error);
      // Still navigate to sign-in even if logout fails
      navigate('/sign-in');
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError('');

    if (!fullName.trim()) {
      setUpdateError('Full name is required');
      setIsUpdating(false);
      return;
    }

    const result = await updateProfile({ full_name: fullName.trim() });
    
    if (result.success) {
      setShowProfileSettings(false);
      setShowProfileMenu(false);
      // Refresh user data
      await fetchUser();
    } else {
      setUpdateError(result.message || 'Failed to update profile');
    }
    
    setIsUpdating(false);
  };

  // Reset visible count when dialog opens/closes
  const handleDialogToggle = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      setVisibleAnomaliesCount(5); // Reset to initial count when closing
    }
  };

  return (
    <>
      {/* HEIGHT: h-[64px], LEFT: Responsive */}
    <header className="fixed top-0 left-[72px] lg:left-[240px] right-0 h-[64px] bg-[#0f0f11]/90 backdrop-blur-md border-b border-white/5 z-[80] flex items-center px-4 lg:px-6 justify-between transition-all duration-300">
      
      {/* Left: Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
          <span className="hover:text-[#007758] cursor-pointer">
            KCX<span className="text-[#00b889]">.</span>
          </span>
          <span>/</span>
          <span className="text-[#007758]">Dashboard</span>
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 justify-center px-8">
        <div className="relative w-full max-w-sm group/search">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/search:text-[#007758] transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[#1a1b20]/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:bg-[#0f0f11] focus:border-[#007758] transition-all"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {hasAnomalies ? (
            <button
              onClick={() => handleDialogToggle(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/30 rounded-lg hover:bg-amber-400/20 transition-all cursor-pointer group"
            >
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Anomalies</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                {anomaliesCount}
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleDialogToggle(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-400/10 border border-green-400/30 rounded-lg hover:bg-green-400/20 transition-all cursor-pointer group"
            >
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-xs font-semibold text-green-400">Smooth</span>
            </button>
          )}
        </div>
        

        {/* User Profile */}
        <div className="pl-2 border-l border-white/10 ml-1 relative" ref={profileMenuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="group flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#007758] to-[#60a5fa] flex items-center justify-center text-white font-bold text-xs shadow-lg ring-1 ring-[#0f0f11]">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'KC')}
            </div>
            
            <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white group-hover:text-[#007758] transition-colors">
                  {user?.full_name || user?.email || 'Client Admin'}
                </div>
            </div>
            
            <ChevronDown size={12} className={`text-gray-500 group-hover:text-white transition-colors ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence mode="wait">
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  duration: 0.15, 
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.1 }
                }}
                className="absolute right-0 top-full mt-2 w-56 bg-[#1a1b20] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden will-change-transform"
              >
                {/* User Info */}
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#007758] to-[#60a5fa] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'KC')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {user?.full_name || user?.email || 'Client Admin'}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {user?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setFullName(user?.full_name || "");
                      setUpdateError("");
                      setShowProfileSettings(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    <span>Profile Settings</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} className="text-red-400" />
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
          className="bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Dialog Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasAnomalies ? (
                <>
                  <div className="p-2 rounded-lg bg-amber-400/10 ring-1 ring-amber-400/20">
                    <AlertTriangle size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Anomalies Detected</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{anomaliesCount} cost anomalies found requiring attention</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-green-400/10 ring-1 ring-green-400/20">
                    <CheckCircle2 size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Smooth Operations</h2>
                    <p className="text-xs text-gray-400 mt-0.5">No cost leakage detected. All costs are within expected ranges.</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => handleDialogToggle(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dialog Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
            {hasAnomalies ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-300 mb-4">
                  The following cost anomalies have been detected. These represent unusual cost spikes that may indicate inefficiencies or require investigation.
                </p>
                <div className="space-y-2">
                  {anomalies.slice(0, visibleAnomaliesCount).map((item: AnomalyItem, index: number) => (
                    <div 
                      key={index}
                      className="bg-[#0f0f11]/50 border border-white/5 rounded-lg p-3 hover:bg-[#0f0f11] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate" title={item.ServiceName || 'Unknown Service'}>
                            {item.ServiceName || 'Unknown Service'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate" title={`${item.ProviderName || 'N/A'} • ${item.RegionName || 'N/A'}`}>
                            {item.ProviderName || 'N/A'} • {item.RegionName || 'N/A'}
                          </p>
                          {item.ResourceId && (
                            <p className="text-xs text-gray-500 mt-1 truncate" title={item.ResourceId}>
                              Resource: {item.ResourceId}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-sm font-bold text-amber-400 whitespace-nowrap">{formatCurrency(item.cost)}</p>
                          {item.ChargePeriodStart && (
                            <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                              {item.ChargePeriodStart.split(' ')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More / Show Less Button */}
                {anomalies.length > visibleAnomaliesCount ? (
                  <div className="flex justify-center pt-3">
                    <button
                      onClick={() => setVisibleAnomaliesCount(anomalies.length)}
                      className="px-4 py-2 bg-[#0f0f11] border border-white/10 hover:border-[#007758]/50 rounded-lg text-xs font-semibold text-gray-300 hover:text-[#007758] transition-all"
                    >
                      Load More ({anomalies.length - visibleAnomaliesCount} remaining)
                    </button>
                  </div>
                ) : visibleAnomaliesCount > 5 && (
                  <div className="flex justify-center pt-3">
                    <button
                      onClick={() => setVisibleAnomaliesCount(5)}
                      className="px-4 py-2 bg-[#0f0f11] border border-white/10 hover:border-[#007758]/50 rounded-lg text-xs font-semibold text-gray-300 hover:text-[#007758] transition-all"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-white mb-2">All Systems Operating Smoothly</p>
                <p className="text-sm text-gray-400">
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            className="bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#007758]/10 ring-1 ring-[#007758]/20">
                  <User size={20} className="text-[#007758]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Profile Settings</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Update your profile information</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileSettings(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  className="w-full bg-[#0f0f11] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#007758] transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-[#0f0f11]/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {updateError && (
                <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
                  <p className="text-xs text-red-400">{updateError}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileSettings(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 bg-[#007758] hover:bg-[#006b4f] rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Save Changes'}
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
