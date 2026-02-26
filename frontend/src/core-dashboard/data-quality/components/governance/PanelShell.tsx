import type { ReactNode } from "react";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelShell({
  title,
  subtitle,
  rightSlot,
  children,
  className = "",
}: PanelShellProps) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-[var(--text-muted)] md:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </header>
      {children}
    </section>
  );
}

export default PanelShell;
