import React, { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Upload as UploadIcon } from "lucide-react";

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

      setTooltipPosition({ top, left: sidebarWidth + 12 });
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
        end={item.end}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={({ isActive }) => `
          group flex items-center justify-center lg:justify-between gap-0 lg:gap-3 px-2 lg:px-3 py-2.5 lg:py-2 mb-1 rounded-lg transition-all duration-200 border border-transparent
          ${
            isActive
              ? "bg-[#a02ff1]/10 text-[#a02ff1] border-[#a02ff1]/20 shadow-[0_0_15px_rgba(160,47,241,0.1)]"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }
          ${isPremiumItemLocked ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex items-center gap-0 lg:gap-3">
          <item.icon size={20} className="lg:w-4 lg:h-4 transition-colors" />
          <span className="hidden lg:inline text-sm font-medium">{item.label}</span>
        </div>

        {!isPremiumUser && item.isPremium && <Crown size={14} className="hidden lg:inline text-yellow-400" />}
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
            initial={{ opacity: 0, x: -15, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -15, scale: 0.96 }}
            className="fixed z-[60] will-change-transform pointer-events-auto"
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
            <div className="bg-[#1a1b20] border border-[#a02ff1]/40 rounded-xl shadow-2xl overflow-hidden w-[280px]">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
                <hoveredItem.icon size={14} className="text-[#a02ff1]" />
                <span className="text-xs font-bold text-white">{hoveredItem.label}</span>
              </div>
              <div className="px-4 py-3 bg-[#0f0f11]">
                <p className="text-[10px] text-gray-400 leading-relaxed">{hoveredItem.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-[72px] lg:w-[240px] bg-[#0f0f11] border-r border-white/5 z-50 flex flex-col transition-all duration-300">
        {/* Brand */}
        <div className="px-2 lg:px-5 py-6 mb-2 flex items-center justify-center lg:justify-start gap-3">
          <img src={brand.logoSrc} alt="Logo" className="w-10 h-10 object-contain" />
          <div className="hidden lg:block">
            <h1 className="text-base font-bold text-white">{brand.name}</h1>
            {brand.subtitle && <p className="text-[10px] text-gray-500 font-mono">{brand.subtitle}</p>}
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-3 space-y-6 scrollbar-hide">
          {groups.map((group, index) => (
            <div key={index}>
              <p className="hidden lg:block px-3 text-[10px] font-bold text-gray-600 uppercase mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Upload (optional) */}
        {showFooterUpload && (
          <div className="p-3 mt-auto bg-[#0f0f11] border-t border-white/5">
            <div
              className={`
                group relative border border-dashed rounded-lg p-3 transition-all
                ${uploadCount >= MAX_UPLOADS ? "border-red-500/50 bg-red-500/5" : "border-gray-700 hover:border-[#a02ff1] bg-[#1a1b20]/50 hover:bg-[#a02ff1]/5"}
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {isLocked ? (
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-yellow-500" />
                    <span className="hidden lg:inline text-xs font-semibold text-white">Upload More (Pro)</span>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-2"
                    onClick={() => (onUploadClick ? onUploadClick() : navigate("/upload"))}
                  >
                    <UploadIcon size={16} className="text-yellow-500" />
                    <span className="hidden lg:inline text-xs font-semibold text-white">Upload More</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
