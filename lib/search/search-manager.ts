import {
  SearchJob,
  Lead,
  SearchStatus,
  LeadProvider,
} from "@/lib/providers/types";
import { mockLeadProvider } from "@/lib/providers/mock-provider";
import { storage } from "@/lib/storage/local-storage";

const MAX_CONCURRENT = 2;
const STATUS_CYCLE: SearchStatus[] = [
  "searching",
  "collecting",
  "checking",
];

const STATUS_MESSAGES: Record<string, string> = {
  queued: "Waiting in queue…",
  searching: "Searching businesses…",
  collecting: "Collecting businesses…",
  checking: "Checking results…",
  completed: "Search complete",
  cancelled: "Search cancelled",
  error: "Search failed",
};

type Listener = () => void;

/**
 * SearchManager — client-side job queue + progressive simulation.
 *
 * Architecture note:
 * In production this will be replaced by server-side workers / queue.
 * On page refresh, in-progress jobs are marked cancelled (browser cannot
 * continue background work). Partial results are preserved.
 */
class SearchManager {
  private searches: SearchJob[] = [];
  private leads: Record<string, Lead> = {};
  private listeners: Set<Listener> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private provider: LeadProvider = mockLeadProvider;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    this.searches = storage.getSearches();
    this.leads = storage.getLeads();

    // Recover interrupted active jobs — mark as cancelled, keep partial results
    let changed = false;
    this.searches = this.searches.map((s) => {
      if (
        s.status === "searching" ||
        s.status === "collecting" ||
        s.status === "checking"
      ) {
        changed = true;
        return {
          ...s,
          status: "cancelled" as SearchStatus,
          completedAt: new Date().toISOString(),
          statusMessage: "Interrupted by page refresh — partial results kept",
        };
      }
      return s;
    });

    if (changed) {
      this.persist();
    }

    // Start any queued jobs if capacity available
    this.advanceQueue();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private persist() {
    storage.setSearches(this.searches);
    storage.setLeads(this.leads);
  }

  getSearches(): SearchJob[] {
    return [...this.searches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getSearch(id: string): SearchJob | undefined {
    return this.searches.find((s) => s.id === id);
  }

  getLeadsForSearch(searchId: string): Lead[] {
    const search = this.getSearch(searchId);
    if (!search) return [];
    return search.leadIds
      .map((id) => this.leads[id])
      .filter(Boolean) as Lead[];
  }

  getAllLeads(): Lead[] {
    return Object.values(this.leads);
  }

  getLead(id: string): Lead | undefined {
    return this.leads[id];
  }

  createSearch(
    businessType: string,
    location: string,
    requestedLeads: number
  ): SearchJob {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `search_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const job: SearchJob = {
      id,
      businessType,
      location,
      requestedLeads,
      processedLeads: 0,
      status: "queued",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      leadIds: [],
      progress: 0,
      statusMessage: STATUS_MESSAGES.queued,
    };

    this.searches = [job, ...this.searches];
    this.persist();
    this.notify();
    this.advanceQueue();
    return job;
  }

  private getActiveCount(): number {
    return this.searches.filter((s) =>
      ["searching", "collecting", "checking"].includes(s.status)
    ).length;
  }

  private advanceQueue() {
    while (this.getActiveCount() < MAX_CONCURRENT) {
      const next = this.searches.find((s) => s.status === "queued");
      if (!next) break;
      this.startJob(next.id);
    }
  }

  private startJob(id: string) {
    const job = this.searches.find((s) => s.id === id);
    if (!job || job.status !== "queued") return;

    this.updateJob(id, {
      status: "searching",
      startedAt: new Date().toISOString(),
      statusMessage: STATUS_MESSAGES.searching,
      progress: 2,
    });

    this.runSimulation(id);
  }

  private updateJob(id: string, patch: Partial<SearchJob>) {
    this.searches = this.searches.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    this.persist();
    this.notify();
  }

  private async runSimulation(id: string) {
    const job = this.getSearch(id);
    if (!job) return;

    // Occasional simulated failure (~6%)
    const willFail = Math.random() < 0.06;

    const total = job.requestedLeads;
    // Vary speed per search for realism
    const tickMs = 400 + Math.random() * 500;
    const batchSize = Math.max(1, Math.floor(total / (12 + Math.random() * 10)));

    let processed = 0;
    let statusIdx = 0;

    const tick = async () => {
      const current = this.getSearch(id);
      if (!current) return;
      if (current.status === "cancelled" || current.status === "error") return;

      if (willFail && processed > total * 0.35 && processed < total * 0.55) {
        this.updateJob(id, {
          status: "error",
          completedAt: new Date().toISOString(),
          statusMessage: STATUS_MESSAGES.error,
          errorMessage:
            "The lead provider could not complete this search. Please try again.",
          progress: Math.round((processed / total) * 100),
        });
        this.advanceQueue();
        return;
      }

      // Fetch a batch from provider
      const remaining = total - processed;
      const take = Math.min(batchSize, remaining);

      try {
        const batch = await this.provider.search({
          businessType: current.businessType,
          location: current.location,
          limit: take,
          offset: processed,
        });

        // Store leads
        const newIds: string[] = [];
        for (const lead of batch) {
          // Ensure unique id in case of reuse
          const uniqueId = `${lead.id}_${id.slice(0, 8)}_${processed + newIds.length}`;
          const stored: Lead = { ...lead, id: uniqueId };
          this.leads[uniqueId] = stored;
          newIds.push(uniqueId);
        }

        processed += newIds.length;
        const progress = Math.min(99, Math.round((processed / total) * 100));

        // Cycle status messages
        statusIdx = (statusIdx + 1) % STATUS_CYCLE.length;
        const nextStatus = STATUS_CYCLE[statusIdx];

        this.updateJob(id, {
          status: nextStatus,
          processedLeads: processed,
          leadIds: [...current.leadIds, ...newIds],
          progress,
          statusMessage: STATUS_MESSAGES[nextStatus],
        });

        // Consume usage for newly found leads
        this.consumeUsage(newIds.length);

        if (processed >= total) {
          this.finishJob(id, processed);
          return;
        }

        // Schedule next tick
        const timer = setTimeout(tick, tickMs);
        this.timers.set(id, timer);
      } catch {
        this.updateJob(id, {
          status: "error",
          completedAt: new Date().toISOString(),
          statusMessage: STATUS_MESSAGES.error,
          errorMessage: "Unexpected error while fetching leads.",
        });
        this.advanceQueue();
      }
    };

    // Start first tick after a short delay
    const timer = setTimeout(tick, 300 + Math.random() * 400);
    this.timers.set(id, timer);
  }

  private finishJob(id: string, processed: number) {
    this.clearTimer(id);
    this.updateJob(id, {
      status: "completed",
      processedLeads: processed,
      progress: 100,
      completedAt: new Date().toISOString(),
      statusMessage: STATUS_MESSAGES.completed,
    });
    this.advanceQueue();
  }

  private clearTimer(id: string) {
    const t = this.timers.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
  }

  cancelSearch(id: string): void {
    const job = this.getSearch(id);
    if (!job) return;

    if (job.status === "queued") {
      this.updateJob(id, {
        status: "cancelled",
        completedAt: new Date().toISOString(),
        statusMessage: "Cancelled before starting",
        progress: 0,
      });
      this.notify();
      return;
    }

    if (["searching", "collecting", "checking"].includes(job.status)) {
      this.clearTimer(id);
      this.updateJob(id, {
        status: "cancelled",
        completedAt: new Date().toISOString(),
        statusMessage: `Cancelled — ${job.processedLeads} leads found`,
      });
      this.advanceQueue();
    }
  }

  retrySearch(id: string): SearchJob | null {
    const old = this.getSearch(id);
    if (!old || old.status !== "error") return null;

    // Create a fresh job with same params
    return this.createSearch(
      old.businessType,
      old.location,
      old.requestedLeads
    );
  }

  private consumeUsage(count: number) {
    if (count <= 0) return;
    const usage = storage.getUsage();
    usage.used = Math.min(usage.limit, usage.used + count);
    storage.setUsage(usage);
    // Usage listeners are handled via React state elsewhere
  }

  /** Stats helpers */
  getStats() {
    const all = this.searches;
    const active = all.filter((s) =>
      ["searching", "collecting", "checking", "queued"].includes(s.status)
    ).length;
    const completed = all.filter((s) => s.status === "completed").length;
    const leadsFound = all.reduce((sum, s) => sum + s.processedLeads, 0);
    return { active, completed, leadsFound };
  }
}

export const searchManager = new SearchManager();
