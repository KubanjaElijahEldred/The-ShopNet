"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ChatAutoRefresh({
  intervalMs = 12_000,
  enabled = true
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
