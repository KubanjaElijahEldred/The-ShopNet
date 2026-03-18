"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { usePathname } from "next/navigation";

type NavUser = {
  name: string;
} | null;

export function AppNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser>(null);

  useEffect(() => {
  // Fetch user session data for navigation bar

    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch("/api/me", {
          signal: controller.signal,
          credentials: "same-origin"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          user?: {
            name?: string;
          } | null;
        };

        setUser(data.user?.name ? { name: data.user.name } : null);
      } catch {
        // Ignore aborted or unauthenticated requests so the nav stays responsive.
      }
    }

    void loadUser();

    return () => controller.abort();
  }, [pathname]);

  return <NavBar user={user} />;
}
