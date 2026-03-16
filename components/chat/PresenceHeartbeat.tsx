"use client";

import { useEffect } from "react";

export function PresenceHeartbeat({ intervalMs = 20_000 }: { intervalMs?: number }) {
  useEffect(() => {
    function pingPresence() {
      fetch("/api/presence", {
        method: "POST",
        cache: "no-store",
        keepalive: true
      }).catch(() => {
        // Presence heartbeat should never block UI interactions.
      });
    }

    pingPresence();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        pingPresence();
      }
    }, intervalMs);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        pingPresence();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);

  return null;
}
