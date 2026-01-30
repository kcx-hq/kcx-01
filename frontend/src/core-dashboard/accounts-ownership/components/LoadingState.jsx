import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading accounts data..." }) {
  return (
    <div className="p-10 text-gray-500 text-center">
      <Loader2 size={48} className="mx-auto mb-4 text-[#a02ff1] animate-spin" />
      <p>{label}</p>
    </div>
  );
}
