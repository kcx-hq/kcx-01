import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

/**
 * --- COMPONENT LOADER ---
 * Used for smaller sections within the dashboard
 */
export const ComponentLoader = () => (
  <div className="flex min-h-[400px] w-full flex-col items-center justify-center">
    <div className="relative">
      <Loader2 className="animate-spin text-[#23a282]" size={32} strokeWidth={1.5} />
      <Sparkles className="absolute -right-1 -top-1 animate-pulse text-emerald-400" size={14} />
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Intel</p>
  </div>
);

/**
 * Section-first loader shown immediately on route switch.
 */
interface SectionLoaderProps {
  sectionName?: string;
}

export const SectionLoader = ({ sectionName = "Section" }: SectionLoaderProps) => (
  <div className="animate-in fade-in zoom-in-95 duration-300">
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[var(--border-light)] bg-white p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <Loader2 className="animate-spin text-[var(--brand-primary)]" size={28} />
          <Sparkles className="absolute -right-1 -top-1 animate-pulse text-emerald-500" size={12} />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)] md:text-lg">Analyzing {sectionName}...</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Preparing the latest insights for this section.</p>
      </div>
    </div>
  </div>
);

/**
 * --- SKELETON LOADER ---
 * Full-screen loading state that preserves layout
 */
export const SkeletonLoader = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 font-sans text-slate-900">
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute h-64 w-64 rounded-full bg-emerald-100 blur-[80px]"
    />

    <div className="relative z-10 flex flex-col items-center">
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-100 border-t-[#23a282]" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex flex-col items-center gap-3 text-center">
        <h3 className="text-base font-bold text-[var(--text-primary)] md:text-lg">Analyzing Dashboard...</h3>
        <p className="text-sm text-[var(--text-muted)]">Loading all modules and latest backend data.</p>
        <div className="h-[2px] w-28 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            animate={{ x: [-112, 112] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-full w-full bg-[#23a282]"
          />
        </div>
      </motion.div>
    </div>
  </div>
);



