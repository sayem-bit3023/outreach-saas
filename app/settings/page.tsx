"use client";

import { UsageMeter } from "@/components/ui/UsageMeter";
import { useUsage } from "@/lib/hooks/use-usage";
import { storage } from "@/lib/storage/local-storage";
import { useState } from "react";

export default function SettingsPage() {
  const { reset } = useUsage();
  const [cleared, setCleared] = useState(false);

  const handleResetUsage = () => {
    reset();
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Clear all demo data (searches, leads, saved leads, usage)? This cannot be undone."
      )
    ) {
      storage.clearAll();
      setCleared(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Demo preferences and data management
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Usage</h2>
        <UsageMeter />
        <button
          onClick={handleResetUsage}
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          Reset usage counter (demo only)
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Data</h2>
        <p className="text-sm text-slate-500">
          All data is stored in your browser&apos;s localStorage. Refreshing
          the page preserves searches, results, and saved leads. In-progress
          searches are marked cancelled on refresh (no background worker).
        </p>
        <button
          onClick={handleClearAll}
          className="h-10 px-4 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Clear all demo data
        </button>
        {cleared && (
          <p className="text-sm text-emerald-600">Data cleared. Reloading…</p>
        )}
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">About this demo</h2>
        <ul className="text-sm text-slate-500 space-y-1.5 list-disc list-inside">
          <li>Lead discovery is fully simulated in the browser</li>
          <li>Max 2 concurrent search jobs (queue advances automatically)</li>
          <li>Free plan: 100 lead discoveries</li>
          <li>No real providers, auth, or billing</li>
          <li>
            Architecture is ready for Supabase + server-side workers later
          </li>
        </ul>
      </section>
    </div>
  );
}
