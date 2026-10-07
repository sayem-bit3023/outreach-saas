import {
  SearchJob,
  Lead,
  SavedLead,
  UsageState,
} from "@/lib/providers/types";

const KEYS = {
  searches: "li_searches",
  leads: "li_leads",
  saved: "li_saved_leads",
  usage: "li_usage",
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  getSearches(): SearchJob[] {
    if (typeof window === "undefined") return [];
    const searches = safeParse<SearchJob[]>(localStorage.getItem(KEYS.searches), []);
    // Older builds persisted provider failures as `failed`; normalize that
    // legacy value so the current Failed section and Retry action still work.
    return searches.map((search) =>
      (search.status as string) === "failed"
        ? { ...search, status: "error", statusMessage: search.statusMessage || "Search failed" }
        : search
    );
  },

  setSearches(searches: SearchJob[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.searches, JSON.stringify(searches));
  },

  getLeads(): Record<string, Lead> {
    if (typeof window === "undefined") return {};
    return safeParse(localStorage.getItem(KEYS.leads), {});
  },

  setLeads(leads: Record<string, Lead>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.leads, JSON.stringify(leads));
  },

  getSavedLeads(): SavedLead[] {
    if (typeof window === "undefined") return [];
    return safeParse(localStorage.getItem(KEYS.saved), []);
  },

  setSavedLeads(saved: SavedLead[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.saved, JSON.stringify(saved));
  },

  getUsage(): UsageState {
    if (typeof window === "undefined") {
      return { used: 0, limit: 100, plan: "free" };
    }
    return safeParse(localStorage.getItem(KEYS.usage), {
      used: 0,
      limit: 100,
      plan: "free" as const,
    });
  },

  setUsage(usage: UsageState): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.usage, JSON.stringify(usage));
  },

  clearAll(): void {
    if (typeof window === "undefined") return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
