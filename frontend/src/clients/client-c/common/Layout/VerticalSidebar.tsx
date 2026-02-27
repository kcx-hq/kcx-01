// src/components/VerticalSidebar.jsx
import React, { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Gauge,
  Users,
  Boxes,
  Sparkles,
  ShieldAlert,
  Table,
  Upload as UploadIcon,
  FileBarChart,
  Crown,
} from "lucide-react";
import { useAuthStore } from '../../../../store/Authstore';
import { motion, AnimatePresence } from "framer-motion";
import type { ComponentType } from "react";
import type { NavLinkRenderProps } from "react-router-dom";

interface ModuleCapability {
  enabled?: boolean;
}

interface ClientCCaps {
  modules?: {
    overview?: ModuleCapability;
    dataExplorer?: ModuleCapability;
    costAnalysis?: ModuleCapability;
    costDrivers?: ModuleCapability;
    resources?: ModuleCapability;
    dataQuality?: ModuleCapability;
    governance?: ModuleCapability;
    optimization?: ModuleCapability;
    departmentCost?: ModuleCapability;
    projectTracking?: ModuleCapability;
    reports?: ModuleCapability;
  };
}

interface VerticalSidebarProps {
  caps?: ClientCCaps;
}

interface NavigationItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  end?: boolean | undefined;
  description?: string | undefined;
  enabled?: boolean | undefined;
  isPremium?: boolean | undefined;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface TooltipPosition {
  top: number;
  left: number;
}

const PreviewContent = ({ item }: { item: NavigationItem }) => {
  if (item.to.includes('overview') || item.to === '/client-c/overview') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0f0f11] border border-white/10 rounded p-2">
            <div className="text-[8px] text-gray-500 mb-1">Total Spend</div>
            <div className="text-xs font-bold text-white">$125k</div>
          </div>
          <div className="bg-[#0f0f11] border border-white/10 rounded p-2">
            <div className="text-[8px] text-gray-500 mb-1">Forecast</div>
            <div className="text-xs font-bold text-[#007758]">+12%</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-gray-400 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#007758]"></div>
          <span>Real-time Metrics</span>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="bg-[#0f0f11] border border-white/10 rounded p-2">
        <div className="text-[8px] text-gray-500 mb-1">Active View</div>
        <div className="text-xs font-bold text-white">{item.label}</div>
      </div>
      <div className="flex items-center gap-2 text-[8px] text-gray-400">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
        <span>Detailed Analysis</span>
      </div>
    </div>
  );
};

const VerticalSidebar = ({ caps = {} }: VerticalSidebarProps) => {
  const { user } = useAuthStore();
  const isPremium = !user?.is_premium; // Show crown if user is NOT premium
  
  const navigate = useNavigate(); // Hook for navigation
  
  // UI States
  const [uploadCount] = useState(() =>
    parseInt(localStorage.getItem('csvUploadCount') || '0', 10)
  );
  const MAX_UPLOADS = 5; // Increased limit for easier testing

  // --- 3. NAVIGATION CONFIGURATION ---
  const navigationGroups: NavigationGroup[] = [
    {
      title: "CORE",
      items: [
        { 
          to: "/client-c/overview", 
          label: "Overview", 
          icon: BarChart3, 
          end: true,
          description: "Complete dashboard overview with KPIs, cost trends, and key metrics",
          enabled: caps.modules?.overview?.enabled 
        },
        {
          to: "/client-c/data-explorer",
          label: "Data Explorer",
          icon: Table,
          description: "Explore and analyze your cost data in tabular format",
          enabled: caps.modules?.dataExplorer?.enabled 
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          to: "/client-c/cost-analysis",
          label: "Cost Analysis",
          icon: TrendingUp,
          description: "Deep dive into cost patterns and spending analysis",
          enabled: caps.modules?.costAnalysis?.enabled 
        },
        { 
          to: "/client-c/cost-drivers", 
          label: "Cost Drivers", 
          icon: Gauge,
          description: "Identify factors driving your cloud costs",
          enabled: caps.modules?.costDrivers?.enabled 
        },
        { 
          to: "/client-c/resources", 
          label: "Resources", 
          icon: Boxes,
          description: "View individual cloud resources and utilization",
          enabled: caps.modules?.resources?.enabled 
        },
        {
          to: "/client-c/data-quality",
          label: "Data Quality",
          icon: ShieldAlert,
          description: "Monitor data completeness and tagging health",
          enabled: caps.modules?.dataQuality?.enabled 
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          to: "/client-c/accounts",
          label: "Accounts and Ownership",
          icon: Users,
          description: "Manage account ownership and allocation",
          enabled: caps.modules?.governance?.enabled 
        },
        {
          to: "/client-c/optimization",
          label: "Optimization",
          icon: Sparkles,
          description: "Cost optimization recommendations",
          enabled: caps.modules?.optimization?.enabled 
        },
        {
          to: "/client-c/department-cost",
          label: "Department Cost",
          icon: Users,
          description: "Department-level cost tracking",
          enabled: caps.modules?.departmentCost?.enabled 
        },

        {
          to: "/client-c/project-tracking",
          label: "Project Tracking",
          icon: FileBarChart,
          description: "Project-level cost tracking and burn rate monitoring",
          enabled: caps.modules?.projectTracking?.enabled 
        },
      ],
    },
    {
      title: "REPORTING",
      items: [
        { 
          to: "/client-c/reports", 
          label: "Reports", 
          icon: FileBarChart,
          description: "Generate and export cost reports",
          enabled: caps.modules?.reports?.enabled 
        },
      ],
    },
  ];

  // --- 4. TOOLTIP LOGIC ---
  const [hoveredItem, setHoveredItem] = useState<NavigationItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isHoveringTooltipRef = useRef(false);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const updateTooltipPosition = (element: HTMLElement | null) => {
    if (!element) return;
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const sidebarWidth = window.innerWidth >= 1024 ? 240 : 72;
      let top = rect.top + rect.height / 2;
      
      // Boundary checks
      const viewportHeight = window.innerHeight;
      if (top - 100 < 0) top = 110;
      else if (top + 100 > viewportHeight) top = viewportHeight - 110;
      
      setTooltipPosition({ top, left: sidebarWidth + 12 });
    });
  };

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (item.description) {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        updateTooltipPosition(e.currentTarget);
        setHoveredItem(item);
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        // Check if moving to tooltip
        const relatedTarget = e.relatedTarget;
        if (relatedTarget instanceof Node && tooltipRef.current && typeof tooltipRef.current.contains === 'function' && tooltipRef.current.contains(relatedTarget)) {
            isHoveringTooltipRef.current = true;
            return;
        }
        isHoveringTooltipRef.current = false;
        hoverTimeoutRef.current = setTimeout(() => {
            if (!isHoveringTooltipRef.current) setHoveredItem(null);
        }, 200);
    };

    return (
        <NavLink
        to={item.to}
        end={item.end ?? false}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={({ isActive }: NavLinkRenderProps) => `
          group flex items-center justify-center lg:justify-between gap-0 lg:gap-3 px-2 lg:px-3 py-2.5 lg:py-2 mb-1 rounded-lg transition-all duration-200 border border-transparent
          ${isActive 
            ? "bg-[#007758]/10 text-[#007758] border-[#007758]/20 shadow-[0_0_15px_rgba(0,119,88,0.1)]" 
            : "text-gray-400 hover:bg-white/5 hover:text-white"}
        `}
      >
        <div className="flex items-center gap-0 lg:gap-3">
          <item.icon size={20} className="lg:w-4 lg:h-4 group-[.active]:text-[#007758] group-hover:text-white transition-colors" />
          <span className="hidden lg:inline text-sm font-medium">{item.label}</span>
        </div>
        {isPremium && item.isPremium && (
          <Crown size={14} className="hidden lg:inline text-yellow-400" />
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Tooltip Overlay */}
      <AnimatePresence mode="wait">
        {hoveredItem && (
          <motion.div
            key={hoveredItem.to}
            ref={tooltipRef}
            initial={{ opacity: 0, x: -15, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -15, scale: 0.96 }}
            className="fixed z-[60] will-change-transform pointer-events-auto"
            style={{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px`, transform: "translateY(-50%)" }}
            onMouseEnter={() => { isHoveringTooltipRef.current = true; if(hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
            onMouseLeave={() => { isHoveringTooltipRef.current = false; setHoveredItem(null); }}
          >
             {/* Tooltip UI Card */}
             <div className="bg-[#1a1b20] border border-[#007758]/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl w-[280px] ring-1 ring-[#007758]/20">
                <div className="bg-gradient-to-r from-[#25262b] to-[#1f2025] border-b border-[#007758]/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <hoveredItem.icon size={14} className="text-[#007758]" />
                        <span className="text-xs font-bold text-white">{hoveredItem.label}</span>
                    </div>
                </div>
                <div className="p-4 bg-[#0f0f11]">
                    <PreviewContent item={hoveredItem} />
                </div>
                <div className="px-4 py-2 bg-[#1a1b20]">
                    <p className="text-[10px] text-gray-400 leading-relaxed">{hoveredItem.description}</p>
                </div>
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-3 h-3 bg-[#1a1b20] border-l border-b border-[#007758]/40 rotate-45"></div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-[72px] lg:w-[240px] bg-[#0f0f11] border-r border-white/5 z-50 flex flex-col transition-all duration-300">
         
         {/* Logo */}
         <div className="px-2 lg:px-5 py-6 mb-2 flex items-center justify-center lg:justify-start gap-3">
           <img src="/KCX.logo.svg" alt="Logo" className="w-10 h-10 object-contain" />
           <div className="hidden lg:block">
             <h1 className="text-base font-bold text-white">
               KCX<span className="text-[#00b889]">.</span>
             </h1>
             <p className="text-[10px] text-gray-500 font-mono">FINOPS OS v2.4</p>
           </div>
         </div>

         {/* Navigation */}
         <div className="flex-1 overflow-y-auto px-2 lg:px-3 space-y-6 scrollbar-hide">
           {navigationGroups.map((group: NavigationGroup, index: number) => (
             <div key={index}>
               <p className="hidden lg:block px-3 text-[10px] font-bold text-gray-600 uppercase mb-2">{group.title}</p>
               <div className="space-y-1">
                 {group.items
                   .filter((item: NavigationItem) => item.enabled !== false)
                   .map((item: NavigationItem) => <NavItem key={item.to} item={item} />)}
               </div>
             </div>
           ))}
         </div>

         {/* Upload / Footer */}
         <div className="p-3 mt-auto bg-[#0f0f11] border-t border-white/5">
            <div className={`
                group relative border border-dashed rounded-lg p-3 transition-all
                ${uploadCount >= MAX_UPLOADS ? "border-red-500/50 bg-red-500/5" : "border-gray-700 hover:border-[#007758] bg-[#1a1b20]/50 hover:bg-[#007758]/5"}
            `}>
               <div className="flex items-center justify-center">
                 <button
                   className="flex items-center gap-2 text-xs font-semibold text-white"
                   onClick={() => navigate('/upload')}
                   disabled={uploadCount >= MAX_UPLOADS}
                 >
                   <UploadIcon size={16} className="text-yellow-500" />
                   <span className="hidden lg:inline">Upload More</span>
                 </button>
               </div>
            </div>
         </div>
      </div>
    </>
  );
};

export default VerticalSidebar;
