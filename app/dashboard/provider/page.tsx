"use client";

import Link from "next/link";
import { useProviderDashboard } from "@/hooks/use-provider-dashboard";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Badge } from "@/components/ui/badge";
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

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Practice Vitals...</p></div>;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Failed to load dashboard."}</p>;

  return (
    <div className="space-y-10 pb-10">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] border-none bg-[#0F172A] p-8 text-white shadow-2xl md:p-12">
        <div className="relative z-10 space-y-4">
          <Badge className="rounded-full border-none bg-sky-400/15 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300 hover:bg-sky-400/25">
             Practice Intelligence
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
              {getGreeting()}, <span className="text-sky-300">{getProviderGreetingName(data.providerName)}</span>
            </h1>
            <p className="max-w-xl text-sm font-medium text-slate-400 md:text-base">
              You have <span className="text-white font-bold">{data.todayAppointments} consultations</span> scheduled for today. 
              Your patient completion rate is up <span className="text-emerald-400 font-bold">12%</span> this week.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              <Link href="/dashboard/provider/schedule">Start Consultation</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest border-slate-700 bg-transparent hover:bg-slate-800 hover:text-white">
              <Link href="/dashboard/provider/patients">Review Patients</Link>
            </Button>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-sky-400/12 blur-[100px]"></div>
        <div className="absolute -bottom-20 right-40 h-64 w-64 rounded-full bg-emerald-500/5 blur-[80px]"></div>
      </section>

      {/* Modern Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard title="Today's Appointments" value={String(data.todayAppointments)} change="+2 from yesterday" variant="primary" />
        <MetricsCard title="Queue Status" value={String(data.queueCount)} change="Live Tracking" variant="emerald" />
        <MetricsCard title="Critical Follow-ups" value={String(data.priorityPatients)} change="Urgent Attention" variant="primary" />
        <MetricsCard title="Completion Rate" value={`${data.completionRate}%`} change="Target: 90%" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr,380px]">
        {/* Interactive Practice Insights */}
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight uppercase">Practice Performance</CardTitle>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Real-time analytical trends</p>
                </div>
                <div className="flex gap-2">
                   <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></div>
                   <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <ProviderDashboardGraphs
                statusData={data.appointmentStatus}
                scheduleData={data.upcomingSchedule}
                priorityData={data.patientPriorityMix}
                monthlyData={data.monthlyConsultations}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight uppercase">Vitals Monitoring</CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Aggregated Patient Health Matrix</p>
              </div>
              <Badge variant="outline" className="rounded-xl border-sky-500/20 px-3 text-[10px] font-black text-sky-600 dark:text-sky-300">LIVE DATA</Badge>
            </CardHeader>
            <CardContent className="p-8 pt-10">
              <VitalsChart data={data.vitals} />
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Sidebar */}
        <div className="space-y-8">
          <Card className="overflow-hidden rounded-[2rem] border-none bg-gradient-to-br from-sky-500/6 to-cyan-400/10 shadow-none">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black tracking-tight uppercase">Top Conditions</CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Focus areas for this week</p>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {data.topConditions.map((condition, idx) => (
                <div key={condition.label} className="group flex cursor-default items-center justify-between rounded-2xl border border-border/40 bg-background/60 p-4 transition-all hover:border-sky-500/25">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 font-black text-sm text-sky-600 dark:text-sky-300">
                       0{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground/90">{condition.label}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">Patient Load</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-sky-600 dark:text-sky-300">{condition.patients}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/40 shadow-sm bg-background p-8 space-y-6">
             <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight">Support Inbox</h3>
                <p className="text-xs font-medium leading-relaxed text-muted-foreground">You have <span className="font-bold text-sky-600 dark:text-sky-300">{data.unreadMessages} messages</span> waiting for clinical response.</p>
             </div>
             <Button asChild variant="outline" className="h-12 w-full rounded-xl border-border/60 bg-muted/50 font-black text-xs uppercase tracking-widest transition-all hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-300">
                <Link href="/dashboard/activity">View Activity Log</Link>
             </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
