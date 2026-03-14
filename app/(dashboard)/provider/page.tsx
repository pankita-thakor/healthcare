import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProviderDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Provider Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard title="Patient Queue" value="12" change="Live" />
        <MetricsCard title="Today Appointments" value="8" change="+2" />
        <MetricsCard title="Pending Notes" value="4" change="Needs review" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Clinical notes</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Write notes and use AI SOAP summarization through OpenRouter.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Prescriptions</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Create and manage medication plans and renewal windows.</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Patient history review</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Chronological timeline of records, labs, prescriptions, and previous visits.</CardContent>
      </Card>
    </div>
  );
}
