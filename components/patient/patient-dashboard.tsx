"use client";

import { useState } from "react";
import Link from "next/link";
import { AppointmentForm } from "@/components/dashboard/appointment-form";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientDashboard } from "@/hooks/use-patient-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Video, ChevronDown, ChevronUp, FileText } from "lucide-react";

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

function formatDoctorName(name: string | null): string {
  if (!name?.trim()) return "Provider";
  const n = name.trim();
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

export function PatientDashboard() {
  const { data, loading, error } = usePatientDashboard();
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);

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
          <Badge className="bg-white/20 text-white border-none hover:bg-white/30 rounded-full px-4 py-1 text-xs font-black uppercase tracking-[0.2em]">
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

      {/* Running consultation - live banner */}
      {data.runningConsultation && (
        <div className="rounded-[2rem] border-2 border-sky-500/50 bg-sky-500/10 dark:bg-sky-500/20 shadow-lg overflow-hidden flex animate-pulse">
          <div className="w-1.5 sm:w-2 flex-shrink-0 bg-sky-500" aria-hidden />
          <div className="flex-1 p-6 sm:p-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-sky-500/20 flex items-center justify-center">
                <span className="h-3 w-3 rounded-full bg-sky-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400 mb-1">Consultation in progress</h3>
                <p className="text-base font-bold text-foreground">
                  Your consultation with {formatDoctorName(data.runningConsultation.providerName)} is running now.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="rounded-xl font-bold shrink-0">
              <Link href={`/consultation/${data.runningConsultation.id}`} className="flex items-center gap-2">
                <Video className="h-4 w-4" /> Enter Call
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Next Visit - important detail highlighted at top */}
      <div className="rounded-[2rem] border border-teal-500/30 bg-background dark:bg-card shadow-lg overflow-hidden flex animate-blink-soft">
        <div className="w-1.5 sm:w-2 flex-shrink-0 bg-teal-500" aria-hidden />
        <div className="flex-1 p-6 sm:p-8 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400 mb-1">Next Visit</h3>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {data.nextAppointment ? (
                <>
                  <span>{new Date(data.nextAppointment).toLocaleString([], { dateStyle: "short", timeStyle: "short", hour12: false })}</span>
                  <span className="text-muted-foreground font-medium"> with </span>
                  <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-400 dark:via-emerald-400 dark:to-teal-500 bg-clip-text text-transparent font-black text-lg sm:text-xl tracking-tight drop-shadow-sm">
                    {formatDoctorName(data.peerProviderName)}
                  </span>
                  <span>.</span>
                </>
              ) : (
                "No visits scheduled. Book a slot above to get started."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard title="Appointments" value={String(data.upcomingAppointments)} change="Upcoming" variant="primary" />
        <MetricsCard title="Completed" value={String(data.completedConsultations)} change="Consultations" variant="emerald" />
        <MetricsCard title="Clinical Messages" value={String(data.unreadMessages)} change="New Notifications" variant="primary" />
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

          {data.pastConsultations.length > 0 && (
            <Card className="rounded-[2rem] border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Older Consultations
                </CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {data.pastConsultations.length} completed consultation{data.pastConsultations.length !== 1 ? "s" : ""}
                </p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-3">
                {data.pastConsultations.map((c) => {
                  const isExpanded = expandedConsultationId === c.id;
                  const hasDetails = c.soapNote && (c.soapNote.subjective || c.soapNote.objective || c.soapNote.assessment || c.soapNote.plan);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {new Date(c.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            with {formatDoctorName(c.providerName)}
                          </p>
                          {c.reason && (
                            <p className="text-xs text-muted-foreground/80 mt-1 italic">&quot;{c.reason}&quot;</p>
                          )}
                        </div>
                        {hasDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0"
                            onClick={() => setExpandedConsultationId(isExpanded ? null : c.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                      {isExpanded && c.soapNote && (
                        <div className="mt-3 pt-3 border-t border-border/40 space-y-2 text-sm">
                          {c.soapNote.subjective && (
                            <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Subjective</p>
                              <p className="text-foreground/90">{c.soapNote.subjective}</p>
                            </div>
                          )}
                          {c.soapNote.objective && (
                            <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Objective</p>
                              <p className="text-foreground/90">{c.soapNote.objective}</p>
                            </div>
                          )}
                          {c.soapNote.assessment && (
                            <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Assessment</p>
                              <p className="text-foreground/90">{c.soapNote.assessment}</p>
                            </div>
                          )}
                          {c.soapNote.plan && (
                            <div>
                              <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Plan</p>
                              <p className="text-foreground/90">{c.soapNote.plan}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] border-border/40 shadow-sm bg-background p-8 group hover:border-primary/30 transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Medical Records</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                {data.medicalRecords
                  ? `You have ${data.medicalRecords} clinical documents available for review in your profile.`
                  : "Clinical records and test results will appear here after your first consultation."}
              </p>
            </Card>

            <Card className="rounded-[2rem] border-border/40 shadow-sm bg-background p-8 group hover:border-primary/30 transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Your Care Team</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                {data.peerProviderName
                  ? `Connected with ${formatDoctorName(data.peerProviderName)}. Book follow-ups or chat via the panel.`
                  : "Book your first appointment above to connect with a provider and start your care journey."}
              </p>
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
