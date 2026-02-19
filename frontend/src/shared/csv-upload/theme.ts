export const uploadGridStyle = {
  backgroundImage:
    "linear-gradient(to right, rgba(28, 35, 33, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(28, 35, 33, 0.05) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
};

export const uploadTheme = {
  pageShell:
    "min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans relative overflow-hidden",
  pageContainer: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12",
  pageGrid: "absolute inset-0 pointer-events-none opacity-60",
  badge:
    "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--border-light)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider shadow-sm",
  card: "rounded-2xl border border-[var(--border-light)] bg-white shadow-sm",
  panel: "rounded-3xl border border-[var(--border-light)] bg-white shadow-sm",
  subPanel:
    "rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm",
  input:
    "mt-2 w-full px-4 py-3 rounded-xl bg-white border border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]",
  primaryButton:
    "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white",
  secondaryButton:
    "bg-white hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-light)]",
  mutedText: "text-[var(--text-muted)]",
  strongText: "text-[var(--text-primary)]",
};
