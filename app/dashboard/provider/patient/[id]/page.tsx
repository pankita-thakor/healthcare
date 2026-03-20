"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Clock } from "lucide-react";

function getConsultationDisplayStatus(
  status: string,
  startTime: string,
  endTime: string
): "running" | "completed" | "pending" | "confirmed" {
  if (status === "completed") return "completed";
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (now > end && ["pending", "confirmed"].includes(status)) return "completed";
  if (now >= start && now <= end && ["pending", "confirmed"].includes(status)) return "running";
  return status as "pending" | "confirmed";
}
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
        <Button asChild variant="outline" className="font-bold">
          <Link href="/dashboard/provider/patients">Back to patients</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Age</span>
               <span className="text-sm font-black">{profile.age ?? "N/A"} years</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phone</span>
               <span className="text-sm font-black">{profile.phone ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gender</span>
               <span className="text-sm font-black">{profile.gender ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Blood Group</span>
               <span className="text-sm font-black text-red-500">{profile.bloodGroup ?? "N/A"}</span>
            </div>
            <div className="space-y-1.5 py-2 border-b border-border/40">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Insurance</p>
               <p className="text-sm font-black leading-relaxed">{profile.insurance ?? "None provided"}</p>
            </div>
            <div className="space-y-1.5">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Condition</p>
               <p className="text-sm font-medium leading-relaxed">{profile.summary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/40 shadow-sm">
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

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/70 text-center">Vital Signs Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <VitalsChart data={profile.vitals} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/40 shadow-sm">
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
                  <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-tighter">
                    {new Date(doc.uploaded_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="truncate text-xs font-medium text-muted-foreground/60 italic">{doc.file_path}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
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
            {profile.consultations.map((visit) => {
              const displayStatus = getConsultationDisplayStatus(
                visit.status,
                visit.start_time,
                visit.end_time ?? visit.start_time
              );
              return (
                <div
                  key={visit.id}
                  className={`rounded-xl border p-3 shadow-sm border-l-4 ${
                    displayStatus === "completed"
                      ? "border-muted-foreground/20 bg-muted/30 opacity-30 border-l-muted-foreground/30"
                      : "border-l-primary/40 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={`text-sm font-black ${
                        displayStatus === "completed" ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {new Date(visit.start_time).toLocaleDateString([], { month: "long", day: "numeric" })}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-black uppercase tracking-widest ${
                        displayStatus === "completed"
                          ? "bg-muted text-muted-foreground"
                          : displayStatus === "running"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                    &quot;{visit.reason ?? "No clinical reason provided."}&quot;
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <div className="mb-6 flex items-center gap-3">
           <div className="h-px flex-1 bg-border/60"></div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">SOAP Note History</h2>
           <div className="h-px flex-1 bg-border/60"></div>
        </div>
        
        {profile.soapNotes.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border/60 p-12 text-center bg-muted/5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No clinical notes recorded yet</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {profile.soapNotes.map((note) => (
              <Card key={note.id} className="rounded-[2rem] border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden group hover:shadow-md transition-all">
                <CardHeader className="p-6 pb-2 border-b border-border/30 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-wider text-foreground/80">
                        Consultation Record
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      <Clock className="h-3 w-3" />
                      {new Date(note.updated_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Subjective</p>
                      <p className="text-xs font-medium leading-relaxed line-clamp-3 text-foreground/90">{note.subjective}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Objective</p>
                      <p className="text-xs font-medium leading-relaxed line-clamp-3 text-foreground/90">{note.objective}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Assessment</p>
                      <p className="text-xs font-medium leading-relaxed line-clamp-3 text-foreground/90">{note.assessment}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Plan</p>
                      <p className="text-xs font-medium leading-relaxed line-clamp-3 text-foreground/90">{note.plan}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="pt-8">
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
