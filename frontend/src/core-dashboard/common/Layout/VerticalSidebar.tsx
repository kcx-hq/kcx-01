import React, { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Upload as UploadIcon, Files } from "lucide-react";

export default function VerticalSidebar({
  config,
  isLocked = false,
  isPremiumUser = true,
  uploadCountStorageKey = "csvUploadCount",
  onUploadClick,
}) {
  const navigate = useNavigate();

  if (!config) {
    console.error("VerticalSidebar: config is missing. Pass config={...}");
    return null;
  }

  // Config defaults
  const { brand, groups, features } = config;
  const showTooltip = features?.tooltip ?? true;
  const showFooterUpload = features?.footerUpload ?? true;
  const MAX_UPLOADS = features?.maxUploads ?? 5;
  const isUploadLocked = !isPremiumUser && isLocked;

  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(uploadCountStorageKey) || "0", 10);
    setUploadCount(count);
  }, [uploadCountStorageKey]);

  // Tooltip state
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const isHoveringTooltipRef = useRef(false);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const updateTooltipPosition = (element) => {
    if (!element) return;
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const sidebarWidth = window.innerWidth >= 1024 ? 240 : 72;
      let top = rect.top + rect.height / 2;

      const viewportHeight = window.innerHeight;
      if (top - 100 < 0) top = 110;
      else if (top + 100 > viewportHeight) top = viewportHeight - 110;

      setTooltipPosition({ top, left: sidebarWidth + 16 });
    });
  };

  const NavItem = ({ item }) => {
    const handleMouseEnter = (e) => {
      if (!showTooltip || !item.description) return;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      updateTooltipPosition(e.currentTarget);
      setHoveredItem(item);
    };

    const handleMouseLeave = (e) => {
      if (!showTooltip) return;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      const relatedTarget = e.relatedTarget;
      if (relatedTarget && tooltipRef.current?.contains(relatedTarget)) {
        isHoveringTooltipRef.current = true;
        return;
      }
      isHoveringTooltipRef.current = false;
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringTooltipRef.current) setHoveredItem(null);
      }, 200);
    };

    const isPremiumItemLocked = item.isPremium && !isPremiumUser;

    return (
      <NavLink
        to={isPremiumItemLocked ? "#" : item.to}
        onClick={(e) => {
          if (isPremiumItemLocked) e.preventDefault();
        }}
        aria-label={item.label}
        title={item.label}
        end={item.end}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={({ isActive }) => `
          group relative flex items-center justify-center lg:justify-between gap-3
          px-3 py-2.5 rounded-lg transition-all duration-200 mb-1
          ${
            isActive
              ? "bg-white/10 text-white border border-white/10"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }
          ${isPremiumItemLocked ? "opacity-50 cursor-not-allowed grayscale" : ""}
        `}
      >
        {({ isActive }) => (
          <>
            <div className="relative z-10 flex items-center gap-3">
              <item.icon
                size={18}
                className={`transition-colors duration-200 ${
                  !isPremiumItemLocked ? "group-hover:text-[var(--brand-primary)]" : ""
                }`}
              />
              <span className="hidden text-sm font-medium lg:block">{item.label}</span>
            </div>

            {!isPremiumUser && item.isPremium && (
              <Crown size={14} className="hidden lg:block text-amber-400" />
            )}

            {/* Active Indicator Bar */}
            <div
              className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--brand-primary)] transition-all duration-300 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {showTooltip && hoveredItem && (
          <motion.div
            key={hoveredItem.to}
            ref={tooltipRef}
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[60] pointer-events-auto"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: "translateY(-50%)",
            }}
            onMouseEnter={() => {
              isHoveringTooltipRef.current = true;
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              isHoveringTooltipRef.current = false;
              setHoveredItem(null);
            }}
          >
            <div className="bg-[#192630] border border-white/10 rounded-xl shadow-2xl overflow-hidden w-[260px] relative">
               {/* Arrow */}
               <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#192630] rotate-45 border-l border-b border-white/10"></div>
               
              <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <hoveredItem.icon size={16} className="text-[var(--brand-primary)]" />
                    <span className="text-sm font-bold text-white">{hoveredItem.label}</span>
                </div>
                {hoveredItem.isPremium && !isPremiumUser && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">Pro</span>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  {hoveredItem.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-screen w-[72px] lg:w-[240px] z-50 flex flex-col transition-all duration-300 border-r border-[var(--border-dark)]"
        style={{ 
            backgroundColor: "var(--bg-dark)"
        }}
      >
        {/* Brand Area */}
        <div className="h-[64px] px-0 lg:px-6 flex items-center justify-center lg:justify-start border-b border-[var(--border-dark)]">
          <div className="flex items-center gap-3">
            {/* Logo placeholder if no src */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand-primary)] text-white font-bold shadow-lg shadow-[var(--brand-primary)]/20">
                {brand.logoSrc ? (
                    <img src={brand.logoSrc} alt="Logo" className="w-5 h-5 object-contain" />
                ) : (
                    "K"
                )}
            </div>
            <div className="hidden lg:block">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">{brand.name}</h1>
              {brand.subtitle && (
                <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">
                  {brand.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-scrollbar flex-1 overflow-y-auto px-2 lg:px-4 py-6 space-y-8">
          {groups.map((group, index) => (
            <div key={index}>
              <p className="hidden lg:block px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Upload Area */}
        {showFooterUpload && (
          <div className="p-3 mt-auto bg-[#162A38] border-t border-white/10">
            <button
              onClick={() => navigate("/billing-uploads")}
              className="w-full mb-2 flex items-center justify-center gap-2 rounded-lg border border-[#1EA88A]/45 bg-[#162A38] hover:bg-[#1A3345] hover:border-[#35C9A7]/80 px-3 py-2 transition-all"
            >
              <Files size={15} className="text-[#007758]" />
              <span className="hidden lg:inline text-xs font-semibold text-white">
                Billing Uploads
              </span>
            </button>

            <div
              className={`
                w-full group relative overflow-hidden rounded-xl p-0 transition-all duration-300 border shadow-sm
                ${isUploadLocked
                    ? "bg-amber-900/10 border-amber-500/20 hover:border-amber-500/40" 
                    : "bg-[#162A38] border-[#1EA88A]/60 hover:border-[#35C9A7]/80 hover:shadow-[0_8px_24px_rgba(0,119,88,0.22)]"
                }
              `}
            >
                <div className="relative z-10 flex flex-col items-center lg:flex-row lg:justify-between p-3 gap-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isUploadLocked ? "bg-amber-500/10 text-amber-400" : "bg-[var(--brand-primary)] text-white shadow-[0_6px_18px_rgba(0,119,88,0.32)]"}`}>
                            {isUploadLocked ? <Crown size={18} /> : <UploadIcon size={18} />}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className={`text-xs font-bold ${isUploadLocked ? "text-amber-200" : "text-white"}`}>
                                {isUploadLocked ? "Upgrade Plan" : "New Upload"}
                            </p>
                            <p className={`text-[10px] ${isUploadLocked ? "text-gray-400" : "text-[#B6C8C2]"}`}>
                                {isUploadLocked
                                  ? "Unlock limits"
                                  : isPremiumUser
                                    ? "Unlimited uploads"
                                    : `${uploadCount}/${MAX_UPLOADS} used`}
                            </p>
                        </div>
                    </div>
                    
                    {!isUploadLocked && (
                        <div className="hidden lg:block text-[var(--brand-primary)] group-hover:translate-x-1 transition-all">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                    )}
                </div>
            </div>

          </div>
        )}
      </div>

      <style>{`
        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #45635a transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3b5a51;
          border-radius: 999px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #4d7368;
        }
      `}</style>
    </>
  );
}
