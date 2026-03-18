"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  Activity, 
  TrendingUp, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  Stethoscope,
  ChevronRight,
  Plus
} from "lucide-react";
import { useProviderDashboard } from "@/hooks/use-provider-dashboard";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderDashboardGraphs } from "@/components/provider/provider-dashboard-graphs";
import { VitalsChart } from "@/components/provider/vitals-chart";
import { QuickSoapModal } from "@/components/dashboard/quick-soap-modal";

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
  const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="relative">
        <div className="h-20 w-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <Stethoscope className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
      </div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Clinic Operations...</p>
    </div>
  );
  
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
      <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <Activity className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-xl font-bold mb-2">Dashboard Unavailable</h3>
      <p className="text-muted-foreground max-w-md">{error ?? "We encountered an issue while loading your clinical insights."}</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10   animate-in fade-in duration-700">
      {/* Dynamic Header Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0F172A] p-8 md:p-14 text-white shadow-2xl group border-none">
        <div className="relative z-10 grid md:grid-cols-[1fr,auto] gap-8 items-center">
          <div className="space-y-6">
            <Badge className="rounded-full border-none bg-sky-400/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-sky-300 backdrop-blur-md">
               Practice Intelligence v2.0
            </Badge>
            <div className="space-y-3">
              <h1 className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl leading-[1.1]">
                {getGreeting()}, <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400">
                  {getProviderGreetingName(data.providerName)}
                </span>
              </h1>
              <p className="max-w-xl text-lg font-medium text-slate-400/90 leading-relaxed">
                Your clinic is seeing high engagement today. <span className="text-white font-bold">{data.todayAppointments} patients</span> are in your queue, with a completion trend that&apos;s <span className="text-emerald-400 font-bold underline decoration-emerald-400/30 underline-offset-4">outperforming</span> last week.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all">
                <Link href="/dashboard/provider/schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Start Consultation
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest border-slate-700 bg-slate-800/40 backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all">
                <Link href="/dashboard/provider/patients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Directory
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col gap-4 p-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
             <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                   <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Verified Provider</p>
                   <p className="text-sm font-bold">Premium Tier Active</p>
                </div>
             </div>
             <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase tracking-tighter">Profile Strength</span>
                   <span className="text-sky-400 font-bold">94%</span>
                </div>
                <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full w-[94%] bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full" />
                </div>
             </div>
          </div>
        </div>
        
        {/* Animated Background Orbs */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-sky-400/15 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-20 left-40 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
      </section>

      {/* High-Impact Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard 
          title="Scheduled Today" 
          value={String(data.todayAppointments)} 
          change="+2 slots available" 
          variant="primary" 
          icon={Calendar}
        />
        <MetricsCard 
          title="Active Patient Queue" 
          value={String(data.queueCount)} 
          change="Real-time Tracking" 
          variant="emerald" 
          icon={Users}
        />
        <MetricsCard 
          title="Priority Follow-ups" 
          value={String(data.priorityPatients)} 
          change="Action Required" 
          variant="primary" 
          icon={Activity}
        />
        <MetricsCard 
          title="Engagement Rate" 
          value={`${data.completionRate}%`} 
          change="Trend: +5.4%" 
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr,400px]">
        <div className="space-y-8">
          {/* Practice Performance Analytics */}
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 overflow-hidden group">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  Analytics Insight
                </CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 ml-13">Practice trends & demographic mix</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs uppercase h-9">Weekly</Button>
                <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs uppercase h-9">Monthly</Button>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <ProviderDashboardGraphs
                statusData={data.appointmentStatus}
                scheduleData={data.upcomingSchedule}
                priorityData={data.patientPriorityMix}
                monthlyData={data.monthlyConsultations}
              />
            </CardContent>
          </Card>

          {/* Health Matrix Chart */}
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  Health Monitoring
                </CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 ml-13">Aggregated Patient Vitals Trend</p>
              </div>
              <Badge variant="outline" className="rounded-xl border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-black text-emerald-600">LIVE SENSOR FEED</Badge>
            </CardHeader>
            <CardContent className="p-10 pt-10">
              <VitalsChart data={data.vitals} />
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Interactive Sidebar */}
        <div className="space-y-8">
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-card shadow-2xl ring-1 ring-border/50">
            <CardHeader className="p-10 pb-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight uppercase">Core Conditions</CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Case Load Focus</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-border/40">
                 <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-4">
              {data.topConditions.map((condition, idx) => (
                <div key={condition.label} className="group flex cursor-default items-center justify-between rounded-3xl border border-border bg-card/80 dark:bg-muted/30 p-5 transition-all hover:bg-muted/50 dark:hover:bg-muted/50 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 dark:bg-primary/25 font-black text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                       {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{condition.label}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Impact Score High</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary block transition-transform">{condition.patients}</span>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Patients</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-[#0F172A] p-10 space-y-8 text-white relative overflow-hidden group">
             <div className="space-y-4 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-sky-400/20 flex items-center justify-center border border-sky-400/30">
                   <MessageSquare className="h-7 w-7 text-sky-400" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Clinical Inbox</h3>
                   <p className="text-sm font-medium leading-relaxed text-slate-400">
                     You have <span className="text-white font-bold">{data.unreadMessages} patient inquiries</span> requiring your medical expertise.
                   </p>
                </div>
                <Button asChild className="h-14 w-full rounded-2xl bg-white text-slate-950 font-black text-xs uppercase tracking-widest transition-all hover:bg-sky-400 hover:text-white group-hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]">
                   <Link href="/dashboard/activity" className="flex items-center justify-center gap-2">
                      Review Activity <ArrowRight className="h-4 w-4" />
                   </Link>
                </Button>
             </div>
             
             {/* Abstract Sidebar Decor */}
             <div className="absolute top-0 right-0 h-32 w-32 bg-sky-400/10 blur-[50px] rounded-full -mr-16 -mt-16"></div>
          </Card>

          {/* Quick Action Widget */}
          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => setIsSoapModalOpen(true)}
                className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-card shadow-sm border border-border hover:shadow-xl hover:border-primary hover:bg-primary/5 dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] transition-all group"
             >
                <div className="h-12 w-12 rounded-2xl bg-primary/15 dark:bg-primary/30 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                   <Plus className="h-6 w-6 text-primary dark:text-white group-hover:text-primary-foreground stroke-[2.5]" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-foreground">New SOAP</span>
             </button>
             <button className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-card shadow-sm border border-border hover:shadow-xl hover:border-primary hover:bg-primary/5 dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] transition-all group">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 dark:bg-primary/30 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                   <MessageSquare className="h-6 w-6 text-primary dark:text-white group-hover:text-primary-foreground stroke-[2.5]" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-foreground">BroadCast</span>
             </button>
          </div>
        </div>
      </div>

      <QuickSoapModal 
        isOpen={isSoapModalOpen} 
        onClose={() => setIsSoapModalOpen(false)} 
      />
    </div>
  );
}
