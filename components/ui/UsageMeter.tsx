"use client";

import { useUsage } from "@/lib/hooks/use-usage";
import { cn } from "@/lib/utils";

export function UsageMeter({ compact = false }: { compact?: boolean }) {
  const { usage, remaining } = useUsage();
  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const nearLimit = remaining <= 20;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700 uppercase tracking-wide text-[10px]">
          Free
        </span>
        <span>
          {usage.used}/{usage.limit}
        </span>
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              nearLimit ? "bg-amber-500" : "bg-slate-700"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Free Plan
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            nearLimit ? "text-amber-600" : "text-slate-700"
          )}
        >
          {usage.used} / {usage.limit} used
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            nearLimit ? "bg-amber-500" : "bg-slate-800"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {remaining} lead discoveries remaining
      </p>
    </div>
  );
}
