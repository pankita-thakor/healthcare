import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/provider" as Route, label: "Overview" },
  { href: "/dashboard/provider/patients" as Route, label: "Patients" },
  { href: "/dashboard/provider/schedule" as Route, label: "Schedule" }
];

export function ProviderNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
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
