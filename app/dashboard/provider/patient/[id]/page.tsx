"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VitalsChart } from "@/components/provider/vitals-chart";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { useProviderPatientProfile } from "@/hooks/use-provider-patient-profile";
import { useAuthUser } from "@/hooks/use-auth-user";

export default function ProviderPatientProfilePage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const doctorId = useAuthUser();
  const { profile, loading, error } = useProviderPatientProfile(patientId);

  if (loading) return <p className="text-sm text-muted-foreground">Loading patient profile...</p>;
  if (error || !profile) return <p className="text-sm text-destructive">{error ?? "Failed to load patient profile."}</p>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{profile.name}</h1>
          <p className="text-sm font-medium text-muted-foreground">Patient Profile & Clinical History</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-border/60 font-bold">
          <Link href="/dashboard/provider/patients">Back to patients</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Age</span>
               <span className="text-sm font-black">{profile.age ?? "N/A"} years</span>
            </div>
            <div className="space-y-1.5">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Condition</p>
               <p className="text-sm font-medium leading-relaxed">{profile.summary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70">Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {profile.medicalHistory ?? "No medical history recorded for this patient."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70 text-center">Vital Signs Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <VitalsChart data={profile.vitals} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                 <p className="text-xs font-bold uppercase tracking-widest">No documents</p>
              </div>
            )}
            {profile.documents.map((doc) => (
              <div key={doc.id} className="group rounded-xl border bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{doc.title}</p>
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter">
                    {new Date(doc.uploaded_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="truncate text-[10px] font-medium text-muted-foreground/60 italic">{doc.file_path}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70">Consultation History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.consultations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                 <p className="text-xs font-bold uppercase tracking-widest">No consultations</p>
              </div>
            )}
            {profile.consultations.map((visit) => (
              <div key={visit.id} className="rounded-xl border bg-background p-3 shadow-sm border-l-4 border-l-primary/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-black text-foreground">
                    {new Date(visit.start_time).toLocaleDateString([], { month: "long", day: "numeric" })}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                    {visit.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                  &quot;{visit.reason ?? 'No clinical reason provided.'}&quot;
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <div className="mb-4 flex items-center gap-3">
           <div className="h-px flex-1 bg-border/60"></div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Secure Communication</h2>
           <div className="h-px flex-1 bg-border/60"></div>
        </div>
        {doctorId && <ChatPanel userId={doctorId} peerId={patientId} peerName={profile.name} />}
      </div>
    </div>
  );
}
