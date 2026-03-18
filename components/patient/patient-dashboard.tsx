"use client";

import { AppointmentForm } from "@/components/dashboard/appointment-form";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientDashboard } from "@/hooks/use-patient-dashboard";
import { Badge } from "@/components/ui/badge";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 16) return "Good Noon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

function getPatientGreetingName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed;
}

export function PatientDashboard() {
  const { data, loading, error } = usePatientDashboard();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">
        Loading Health Profile...
      </p>
    </div>
  );
  
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Failed to load dashboard."}</p>;

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[2.5rem] border-none bg-[#0D9488] p-8 text-white shadow-2xl md:p-12">
        <div className="relative z-10 space-y-4">
          <Badge className="bg-white/20 text-white border-none hover:bg-white/30 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
             Patient Wellness Portal
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
              {getGreeting()}, <span className="text-white opacity-90">{getPatientGreetingName(data.patientName)}</span>
            </h1>
            <p className="max-w-xl text-sm font-medium text-teal-50/80 md:text-base">
              Welcome to your connected care space. You have <span className="text-white font-bold">{data.upcomingAppointments} upcoming visits</span> and <span className="text-white font-bold">{data.unreadMessages} messages</span> waiting.
            </p>
          </div>
        </div>
        
        {/* Abstract Decoration */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]"></div>
        <div className="absolute -bottom-20 right-40 h-64 w-64 rounded-full bg-white/5 blur-[80px]"></div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricsCard title="Appointments" value={String(data.upcomingAppointments)} change="Upcoming" variant="primary" />
        <MetricsCard title="Clinical Messages" value={String(data.unreadMessages)} change="New Notifications" variant="emerald" />
        <MetricsCard title="Active Prescriptions" value={String(data.prescriptions)} change="In Review" variant="primary" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr,400px]">
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black tracking-tight uppercase">Schedule Consultation</CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Book a time with your preferred specialist</p>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <AppointmentForm patientId={data.patientId} defaultProviderId={data.peerProviderId ?? ""} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] border-border/40 shadow-sm bg-background p-8 group hover:border-primary/30 transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Medical Records</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                {data.medicalRecords
                  ? `You have ${data.medicalRecords} clinical documents available for review in your profile.`
                  : "Clinical records and test results will appear here after your first consultation."}
              </p>
            </Card>

            <Card className="rounded-[2rem] border-border/40 shadow-sm bg-[#F8FAFC] dark:bg-slate-900 p-8 border-l-8 border-l-primary/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Next Visit</h3>
              <div className="text-sm font-medium text-muted-foreground leading-relaxed">
                {data.nextAppointment
                  ? <span className="font-bold text-foreground">{new Date(data.nextAppointment).toLocaleString()} with {data.peerProviderName ?? "your provider"}.</span>
                  : "No visits scheduled currently. Use the form above to find an available slot."}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          {data.peerProviderId ? (
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Provider Chat</h3>
               </div>
               <ChatPanel userId={data.patientId} peerId={data.peerProviderId} peerName={data.peerProviderName ?? undefined} />
            </div>
          ) : (
            <Card className="rounded-[2rem] border-dashed border-2 bg-muted/20 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4 text-muted-foreground/40">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">No Conversations</h3>
              <p className="text-xs font-medium text-muted-foreground">Book an appointment to start a direct secure chat with your provider.</p>
            </Card>
          )}
          
          <Card className="rounded-[2rem] border-none bg-gradient-to-br from-teal-500/5 to-teal-500/10 p-8">
             <h3 className="text-base font-black uppercase tracking-tight mb-3">Health Tip</h3>
             <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">
               &quot;Regular virtual follow-ups help catch minor symptoms before they become major concerns. Stay connected with your care team.&quot;
             </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
