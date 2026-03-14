import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

const links: Array<{ href: Route; label: string }> = [
  { href: "/dashboard/provider", label: "Overview" },
  { href: "/dashboard/provider/patients", label: "Patients" },
  { href: "/dashboard/provider/schedule", label: "Schedule" }
];

export function ProviderNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={String(link.href)}
          href={link.href as Route}
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            pathname === link.href ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
