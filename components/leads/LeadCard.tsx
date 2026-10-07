"use client";

import { Lead } from "@/lib/providers/types";
import { useSavedLeads } from "@/lib/hooks/use-saved-leads";
import {
  Globe,
  Phone,
  MapPin,
  Star,
  Bookmark,
  BookmarkCheck,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lead: Lead;
  searchId: string;
}

export function LeadCard({ lead, searchId }: Props) {
  const { isSaved, save, unsave } = useSavedLeads();
  const saved = isSaved(lead.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-900">{lead.businessName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{lead.businessType}</p>
        </div>
        <button
          onClick={() =>
            saved ? unsave(lead.id) : save(lead.id, searchId)
          }
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border shrink-0",
            saved
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-white text-slate-600 border-slate-200"
          )}
        >
          {saved ? (
            <BookmarkCheck className="w-3.5 h-3.5" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="space-y-1.5 text-sm text-slate-600">
        {lead.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{lead.website}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {lead.phone}
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {lead.city}, {lead.country}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {lead.hasWebsite && (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
            <Check className="w-3 h-3" /> Website
          </span>
        )}
        {lead.hasPhone && (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
            <Check className="w-3 h-3" /> Phone
          </span>
        )}
        {lead.rating !== null && (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {lead.rating}
            {lead.reviewCount ? ` (${lead.reviewCount})` : ""}
          </span>
        )}
        {lead.websiteQuality === "needs_improvement" && (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
            <AlertTriangle className="w-3 h-3" /> Needs improvement
          </span>
        )}
      </div>

      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
        Source: {lead.source}
      </div>
    </div>
  );
}
