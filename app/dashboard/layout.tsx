import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
