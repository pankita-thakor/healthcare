"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/patient" as Route, label: "Patient" },
  { href: "/dashboard/provider" as Route, label: "Provider" },
  { href: "/dashboard/admin" as Route, label: "Admin" }
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
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
