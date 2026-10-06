"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessType } from "@/lib/providers/types";
import { useSearches } from "@/lib/hooks/use-search";
import { useUsage } from "@/lib/hooks/use-usage";
import { Search, AlertCircle } from "lucide-react";

const BUSINESS_TYPES: BusinessType[] = [
  "Dentist",
  "Restaurant",
  "Gym",
  "Cafe",
  "Hotel",
  "Real Estate Agency",
  "Custom",
];

const LEAD_COUNTS = [25, 50, 100, 250];

export function SearchForm() {
  const router = useRouter();
  const { createSearch } = useSearches();
  const { remaining, canAfford } = useUsage();

  const [businessType, setBusinessType] = useState<string>("Dentist");
  const [customType, setCustomType] = useState("");
  const [location, setLocation] = useState("Dhaka, Bangladesh");
  const [requestedLeads, setRequestedLeads] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveType =
    businessType === "Custom" ? customType.trim() || "Custom" : businessType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location.trim()) {
      setError("Please enter a location.");
      return;
    }

    if (businessType === "Custom" && !customType.trim()) {
      setError("Please enter a custom business type.");
      return;
    }

    if (!canAfford(requestedLeads)) {
      setError(
        `You only have ${remaining} lead discoveries remaining.`
      );
      return;
    }

    setSubmitting(true);
    const job = createSearch(effectiveType, location.trim(), requestedLeads);
    setSubmitting(false);
    router.push(`/searches/${job.id}`);
  };

  const reduceSize = () => {
    const affordable = LEAD_COUNTS.filter((n) => n <= remaining);
    if (affordable.length > 0) {
      setRequestedLeads(affordable[affordable.length - 1]);
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Business Type
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {businessType === "Custom" && (
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="e.g. Pet Grooming, Law Firm…"
              className="mt-2 w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>

        {/* Number of Leads */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Number of Leads
          </label>
          <div className="grid grid-cols-4 gap-2">
            {LEAD_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setRequestedLeads(n);
                  setError(null);
                }}
                className={`h-11 rounded-lg text-sm font-medium border transition-colors ${
                  requestedLeads === n
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            This search can use up to {requestedLeads} lead discoveries.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800">{error}</p>
              {!canAfford(requestedLeads) && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={reduceSize}
                    className="text-xs font-medium text-amber-800 underline"
                  >
                    Reduce Search Size
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500"
                    disabled
                  >
                    View Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          <Search className="w-4 h-4" />
          {submitting ? "Creating…" : "Find Leads"}
        </button>
      </div>
    </form>
  );
}
