import React from "react";
import { AlertCircle, Lightbulb } from "lucide-react";

export function CommitmentsTab() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-md rounded-xl border border-[var(--border-light)] bg-white p-10 text-center">
        <AlertCircle size={64} className="mx-auto mb-6 text-[var(--brand-primary)]" />
        <h3 className="mb-3 text-2xl font-bold text-[var(--text-primary)]">Coming Soon</h3>
        <p className="mb-6 text-[var(--text-muted)]">
          Commitment analysis and Reserved Instance recommendations will be available soon.
          This feature will help you identify opportunities for Savings Plans and Reserved Instances.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <Lightbulb size={16} />
          <span>Stay tuned for updates.</span>
        </div>
      </div>
    </div>
  );
}

export default CommitmentsTab;

