import { UsageState } from "@/lib/providers/types";
import { storage } from "@/lib/storage/local-storage";

type Listener = () => void;

class UsageManager {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  get(): UsageState {
    return storage.getUsage();
  }

  remaining(): number {
    const u = this.get();
    return Math.max(0, u.limit - u.used);
  }

  canAfford(requested: number): boolean {
    return this.remaining() >= requested;
  }

  /** Called by search manager after leads are discovered */
  consume(count: number) {
    if (count <= 0) return;
    const u = this.get();
    u.used = Math.min(u.limit, u.used + count);
    storage.setUsage(u);
    this.notify();
  }

  /** For demo reset in Settings */
  reset() {
    storage.setUsage({ used: 0, limit: 100, plan: "free" });
    this.notify();
  }

  refresh() {
    this.notify();
  }
}

export const usageManager = new UsageManager();
