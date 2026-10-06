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

export function LeadRow({ lead, searchId }: Props) {
  const { isSaved, save, unsave } = useSavedLeads();
  const saved = isSaved(lead.id);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 px-4">
        <div className="font-medium text-slate-900">{lead.businessName}</div>
        <div className="text-xs text-slate-500 mt-0.5">{lead.businessType}</div>
      </td>
      <td className="py-3.5 px-4 hidden md:table-cell">
        <div className="space-y-1 text-sm">
          {lead.website ? (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[180px]">{lead.website}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">No website</span>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {lead.phone}
            </div>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[160px]">
            {lead.city}, {lead.country}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-4 hidden sm:table-cell">
        <div className="flex flex-wrap gap-1.5">
          {lead.hasWebsite ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
              <Check className="w-3 h-3" /> Website
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
              No site
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
            </span>
          )}
          {lead.websiteQuality === "needs_improvement" && (
            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
              <AlertTriangle className="w-3 h-3" /> Site needs work
            </span>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 text-right">
        <button
          onClick={() =>
            saved ? unsave(lead.id) : save(lead.id, searchId)
          }
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors",
            saved
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          {saved ? (
            <>
              <BookmarkCheck className="w-3.5 h-3.5" /> Saved
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5" /> Save
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
