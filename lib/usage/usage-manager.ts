import type { UsageState } from "@/lib/providers/types";

type Listener = () => void;

type UsageResponse = {
  used: number;
  reserved: number;
  remaining: number;
  limit: number;
  plan: "free";
};

const INITIAL_USAGE: UsageState = {
  used: 0,
  reserved: 0,
  remaining: 0,
  limit: 100,
  plan: "free",
  loading: true,
};

class UsageManager {
  private listeners: Set<Listener> = new Set();
  private usage: UsageState = { ...INITIAL_USAGE };
  private refreshPromise: Promise<void> | null = null;
  private generation = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  get(): UsageState {
    return { ...this.usage };
  }

  remaining(): number {
    return this.usage.remaining;
  }

  resetForAuthChange(): void {
    this.generation += 1;
    this.refreshPromise = null;
    this.usage = { ...INITIAL_USAGE };
    this.notify();
  }

  async refresh(): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.refreshPromise) return this.refreshPromise;

    const generation = this.generation;
    const pending = (async () => {
      try {
        const response = await fetch("/api/usage", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (generation !== this.generation) return;
        if (!response.ok) {
          const message = response.status === 401
            ? "Your session could not be verified. Sign in again."
            : "Usage could not be loaded. Refresh to try again.";
          this.usage = { ...this.usage, loading: false, error: message };
          return;
        }

        const data = (await response.json()) as UsageResponse;
        if (generation !== this.generation) return;
        if (
          !Number.isInteger(data.used) ||
          !Number.isInteger(data.reserved) ||
          !Number.isInteger(data.remaining) ||
          data.limit !== 100
        ) {
          throw new Error("The usage response was invalid.");
        }

        this.usage = {
          used: data.used,
          reserved: data.reserved,
          remaining: data.remaining,
          limit: data.limit,
          plan: "free",
          loading: false,
        };
      } catch {
        if (generation === this.generation) {
          this.usage = {
            ...this.usage,
            loading: false,
            error: "Usage could not be loaded. Refresh to try again.",
          };
        }
      } finally {
        if (generation === this.generation) {
          this.notify();
          this.refreshPromise = null;
        }
      }
    })();

    this.refreshPromise = pending;
    return pending;
  }
}

export const usageManager = new UsageManager();
