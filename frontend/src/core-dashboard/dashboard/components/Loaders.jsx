import React from "react";
import { Loader2 } from "lucide-react";
import VerticalSidebar from "../../common/Layout/VerticalSidebar";
import Header from "../../common/Layout/Header";

export const ComponentLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2
      className="animate-spin"
      size={32}
      style={{ color: "var(--brand-secondary, #007758)" }}
    />
  </div>
);

export const SkeletonLoader = () => (
  <div className="min-h-screen bg-[#0f0f11] text-white font-sans">
    <VerticalSidebar />
    <Header title="Loading..." />
    <main className="ml-[72px] lg:ml-[240px] pt-[64px] min-h-screen">
      <div className="p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2
            className="animate-spin"
            size={48}
            style={{ color: "var(--brand-secondary, #007758)" }}
          />
        </div>
      </div>
    </main>
  </div>
);
