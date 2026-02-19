// src/components/VerticalSidebar.jsx
import React, { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
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
  Play,
  FileBarChart,
  Loader2,
  AlertCircle,
  Crown,
} from "lucide-react";
import { useAuthStore } from '../../../../store/Authstore';
import { motion, AnimatePresence } from "framer-motion";

const VerticalSidebar = ({ onCsvSelected, caps = {} }) => {
  const { user } = useAuthStore();
  const isPremium = !user?.is_premium; // Show crown if user is NOT premium
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // Hook for navigation
  
  // UI States
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadCount, setUploadCount] = useState(0);
  const MAX_UPLOADS = 5; // Increased limit for easier testing

  // Load upload count from local storage
  useEffect(() => {
    const count = parseInt(localStorage.getItem('csvUploadCount') || '0', 10);
    setUploadCount(count);
  }, []);

  // --- 1. HANDLE FILE SELECTION ---
  const openFilePicker = () => {
    if (uploadCount >= MAX_UPLOADS) {
      setUploadError(`Limit reached.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadCount >= MAX_UPLOADS) {
        setUploadError(`Limit reached.`);
        return;
      }
      setSelectedFileName(file.name);
      setSelectedFile(file);
      setUploadError("");
      if (onCsvSelected) onCsvSelected(file);
    }
  };

  // --- 2. PROCESS UPLOAD (THE FIX) ---
  const handleProcessUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // API CALL: Sends file to backend
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${API_URL}/api/etl`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true 
      });

      if (response.status === 200) {
         // A. Extract the new Upload ID from backend response
         const { uploadId } = response.data;

         // B. Update Local UI Counters
         const newCount = uploadCount + 1;
         localStorage.setItem('csvUploadCount', newCount.toString());
         setUploadCount(newCount);

         // C. Reset Input UI
         setSelectedFile(null);
         setSelectedFileName("");
         if (fileInputRef.current) fileInputRef.current.value = '';
         setUploading(false);

         // D. NAVIGATE WITH STATE (Crucial Step)
         // Instead of reloading, we push the new ID to the router state.
         // DashboardPage.jsx will pick this up immediately.
         navigate('/client-c', { 
           state: { uploadId: uploadId },
           replace: true // Replaces history so "Back" button works better
         });
      }
      
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
      const serverError = error.response?.data?.error || "Upload failed. Check console.";
      setUploadError(serverError);
    }
  };

  // --- 3. NAVIGATION CONFIGURATION ---
  const navigationGroups = [
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
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const isHoveringTooltipRef = useRef(false);

  // Cleanup timeout
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
      
      // Boundary checks
      const viewportHeight = window.innerHeight;
      if (top - 100 < 0) top = 110;
      else if (top + 100 > viewportHeight) top = viewportHeight - 110;
      
      setTooltipPosition({ top, left: sidebarWidth + 12 });
    });
  };

  // Preview Content Switcher (Pure UI)
  const PreviewContent = ({ item }) => {
    // Simplified preview logic for brevity - purely visual
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
                  <div className="text-xs font-bold text-[#a02ff1]">+12%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-gray-400 mt-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#a02ff1]"></div>
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

  const NavItem = ({ item }) => {
    const handleMouseEnter = (e) => {
      if (item.description) {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        updateTooltipPosition(e.currentTarget);
        setHoveredItem(item);
      }
    };

    const handleMouseLeave = (e) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        // Check if moving to tooltip
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && tooltipRef.current && typeof tooltipRef.current.contains === 'function' && tooltipRef.current.contains(relatedTarget)) {
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
        end={item.end}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={({ isActive }) => `
          group flex items-center justify-center lg:justify-between gap-0 lg:gap-3 px-2 lg:px-3 py-2.5 lg:py-2 mb-1 rounded-lg transition-all duration-200 border border-transparent
          ${isActive 
            ? "bg-[#a02ff1]/10 text-[#a02ff1] border-[#a02ff1]/20 shadow-[0_0_15px_rgba(160,47,241,0.1)]" 
            : "text-gray-400 hover:bg-white/5 hover:text-white"}
        `}
      >
        <div className="flex items-center gap-0 lg:gap-3">
          <item.icon size={20} className="lg:w-4 lg:h-4 group-[.active]:text-[#a02ff1] group-hover:text-white transition-colors" />
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
             <div className="bg-[#1a1b20] border border-[#a02ff1]/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl w-[280px] ring-1 ring-[#a02ff1]/20">
                <div className="bg-gradient-to-r from-[#25262b] to-[#1f2025] border-b border-[#a02ff1]/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <hoveredItem.icon size={14} className="text-[#a02ff1]" />
                        <span className="text-xs font-bold text-white">{hoveredItem.label}</span>
                    </div>
                </div>
                <div className="p-4 bg-[#0f0f11]">
                    <PreviewContent item={hoveredItem} />
                </div>
                <div className="px-4 py-2 bg-[#1a1b20]">
                    <p className="text-[10px] text-gray-400 leading-relaxed">{hoveredItem.description}</p>
                </div>
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-3 h-3 bg-[#1a1b20] border-l border-b border-[#a02ff1]/40 rotate-45"></div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-[72px] lg:w-[240px] bg-[#0f0f11] border-r border-white/5 z-50 flex flex-col transition-all duration-300">
         
         {/* Logo */}
         <div className="px-2 lg:px-5 py-6 mb-2 flex items-center justify-center lg:justify-start gap-3">
           <img src="/k&cologo.svg" alt="Logo" className="w-10 h-10 object-contain" />
           <div className="hidden lg:block">
             <h1 className="text-base font-bold text-white">K&Co.</h1>
             <p className="text-[10px] text-gray-500 font-mono">FINOPS OS v2.4</p>
           </div>
         </div>

         {/* Navigation */}
         <div className="flex-1 overflow-y-auto px-2 lg:px-3 space-y-6 scrollbar-hide">
           {navigationGroups.map((group, index) => (
             <div key={index}>
               <p className="hidden lg:block px-3 text-[10px] font-bold text-gray-600 uppercase mb-2">{group.title}</p>
               <div className="space-y-1">
                 {group.items
                   .filter(item => item.enabled !== false)
                   .map((item) => <NavItem key={item.to} item={item} />)}
               </div>
             </div>
           ))}
         </div>

         {/* Upload / Footer */}
         <div className="p-3 mt-auto bg-[#0f0f11] border-t border-white/5">
            <div className={`
                group relative border border-dashed rounded-lg p-3 transition-all
                ${uploadCount >= MAX_UPLOADS ? "border-red-500/50 bg-red-500/5" : "border-gray-700 hover:border-[#a02ff1] bg-[#1a1b20]/50 hover:bg-[#a02ff1]/5"}
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