import React from 'react';

interface StatusBannerProps {
  variant: 'error' | 'refresh';
  message: string;
}

const VARIANT_CLASS: Record<StatusBannerProps['variant'], string> = {
  error: 'border-amber-200 bg-amber-50 text-amber-700',
  refresh: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function StatusBanner({ variant, message }: StatusBannerProps) {
  return (
    <div
      className={[
        'rounded-xl border px-3 py-2 font-semibold',
        variant === 'refresh' ? 'text-xs font-black uppercase tracking-wider' : 'text-sm',
        VARIANT_CLASS[variant],
      ].join(' ')}
    >
      {message}
    </div>
  );
}
