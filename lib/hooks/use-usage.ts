"use client";

import { useEffect, useState } from "react";
import { UsageState } from "@/lib/providers/types";
import { usageManager } from "@/lib/usage/usage-manager";
import { searchManager } from "@/lib/search/search-manager";

export function useUsage() {
  const [usage, setUsage] = useState<UsageState>({
    used: 0,
    limit: 100,
    plan: "free",
  });

  useEffect(() => {
    setUsage(usageManager.get());
    const unsub1 = usageManager.subscribe(() => setUsage(usageManager.get()));
    // Also refresh when searches change (usage is consumed there)
    const unsub2 = searchManager.subscribe(() => {
      setUsage(usageManager.get());
      usageManager.refresh();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return {
    usage,
    remaining: Math.max(0, usage.limit - usage.used),
    canAfford: (n: number) => usageManager.canAfford(n),
    reset: () => usageManager.reset(),
  };
}
