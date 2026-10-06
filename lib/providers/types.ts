export type BusinessType =
  | "Dentist"
  | "Restaurant"
  | "Gym"
  | "Cafe"
  | "Hotel"
  | "Real Estate Agency"
  | "Custom";

export type SearchStatus =
  | "queued"
  | "searching"
  | "collecting"
  | "checking"
  | "completed"
  | "cancelled"
  | "error";

export interface Lead {
  id: string;
  businessName: string;
  businessType: string;
  website: string | null;
  phone: string | null;
  address: string;
  city: string;
  country: string;
  source: string;
  sourceId: string;
  latitude: number;
  longitude: number;
  /** Simulated quality signals */
  hasWebsite: boolean;
  hasPhone: boolean;
  rating: number | null;
  reviewCount: number | null;
  websiteQuality: "good" | "needs_improvement" | "unknown";
}

export interface SearchJob {
  id: string;
  businessType: string;
  location: string;
  requestedLeads: number;
  processedLeads: number;
  status: SearchStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  /** IDs of leads discovered by this search */
  leadIds: string[];
  /** Progress 0-100 */
  progress: number;
  statusMessage: string;
  errorMessage?: string;
}

export interface SavedLead {
  leadId: string;
  savedAt: string;
  searchId: string;
}

export interface UsageState {
  used: number;
  limit: number;
  plan: "free";
}

export interface LeadProviderSearchParams {
  businessType: string;
  location: string;
  limit: number;
  /** Offset for progressive fetching simulation */
  offset?: number;
}

export interface ProviderSearchResult {
  provider: string;
  leads: Lead[];
}

export interface LeadProvider {
  search(params: LeadProviderSearchParams): Promise<Lead[]>;
  getName(): string;
}
