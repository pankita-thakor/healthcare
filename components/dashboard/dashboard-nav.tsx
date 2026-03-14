"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links: Array<{ href: Route; label: string }> = [
  { href: "/dashboard/patient", label: "Patient" },
  { href: "/dashboard/provider", label: "Provider" },
  { href: "/dashboard/admin", label: "Admin" }
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2">
      {links.map((link) => (
        <Link
          key={String(link.href)}
          href={link.href as Route}
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            pathname === link.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
