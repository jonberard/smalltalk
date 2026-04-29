"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/supabase";

export type RequestAllowanceSummaryResponse =
  | {
      kind: "trial";
      used: number;
      remaining: number;
      total: number;
      resetAt: string | null;
      warningLevel: "none" | "heads_up" | "almost_full" | "exhausted";
    }
  | {
      kind: "paid";
      used: number;
      remaining: number;
      total: number;
      included: number;
      included_remaining: number;
      extra: number;
      cycleStart: string;
      resetAt: string;
      warningLevel: "none" | "heads_up" | "almost_full" | "exhausted";
    }
  | {
      kind: "inactive";
      used: number;
      remaining: number;
      total: number;
      resetAt: string | null;
      warningLevel: "exhausted";
    };

export function useRequestAllowanceSummary(enabled = true) {
  const [summary, setSummary] = useState<RequestAllowanceSummaryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithAuth("/api/request-allowance/summary");
      const data =
        (await res.json().catch(() => null)) as RequestAllowanceSummaryResponse | null;

      if (res.ok && data) {
        setSummary(data);
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}
