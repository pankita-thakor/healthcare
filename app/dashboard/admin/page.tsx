import { ProviderApprovalPanel } from "@/components/dashboard/provider-approval-panel";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricsCard title="Total Users" value="2,418" change="+8.1%" />
        <MetricsCard title="Provider Utilization" value="74%" change="+3.2%" />
        <MetricsCard title="Revenue (MTD)" value="$84,200" change="+9.4%" />
        <MetricsCard title="System Health" value="99.98%" change="Stable" />
      </div>
      <ProviderApprovalPanel />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>User management</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Manage user accounts, verification, and role assignment.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Provider management</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Credentialing status, availability, and patient load balancing.</CardContent>
        </Card>
      </div>
    </div>
  );
}
