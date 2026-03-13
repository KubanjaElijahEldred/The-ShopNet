"use client";

import { NavBar } from "@/components/NavBar";
import { usePathname } from "next/navigation";

type AppNavProps = {
  user: {
    name: string;
  } | null;
};

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <NavBar user={user} />;
}
