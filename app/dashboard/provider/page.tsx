"use client";

import Link from "next/link";
import { useProviderDashboard } from "@/hooks/use-provider-dashboard";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderDashboardGraphs } from "@/components/provider/provider-dashboard-graphs";
import { VitalsChart } from "@/components/provider/vitals-chart";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 16) return "Good Noon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

function getProviderGreetingName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Doctor";
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

export default function ProviderDashboardPage() {
  const { data, loading, error } = useProviderDashboard();

  if (loading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Failed to load dashboard."}</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-gradient-to-r from-sky-100 to-cyan-50 p-6 dark:from-slate-900 dark:to-slate-800">
        <h1 className="text-2xl font-semibold">{getGreeting()} {getProviderGreetingName(data.providerName)}</h1>
        <p className="text-sm text-muted-foreground">{data.categoryName} Specialist Dashboard</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricsCard title="Today's Appointments" value={String(data.todayAppointments)} change="Today" />
        <MetricsCard title="Active Patients" value={String(data.totalPatients)} change="Under care" />
        <MetricsCard title="Priority Patients" value={String(data.priorityPatients)} change="Attention" />
        <MetricsCard title="Completion Rate" value={`${data.completionRate}%`} change="This cycle" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricsCard title="Consultation Queue" value={String(data.queueCount)} change="Live" />
        <MetricsCard title="Follow-ups Due" value={String(data.followUpsDue)} change="Next 3 days" />
        <MetricsCard title="Messages" value={String(data.unreadMessages)} change="Unread" />
        <MetricsCard title="Reports & Documents" value={String(data.reportsCount)} change="Files" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm"><Link href="/dashboard/provider/schedule">Open schedule</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/dashboard/provider/patients">View patients</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Top Patient Needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topConditions.map((condition) => (
              <div key={condition.label} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{condition.label}</p>
                  <p className="text-xs text-muted-foreground">Patients requiring review</p>
                </div>
                <span className="text-lg font-semibold">{condition.patients}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderDashboardGraphs
            statusData={data.appointmentStatus}
            scheduleData={data.upcomingSchedule}
            priorityData={data.patientPriorityMix}
            monthlyData={data.monthlyConsultations}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient Health Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <VitalsChart data={data.vitals} />
        </CardContent>
      </Card>
    </div>
  );
}
