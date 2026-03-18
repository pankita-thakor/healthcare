"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, FileText, MessageSquareText, Pencil, Trash2, Video } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteSoapNote,
  ensureConsultationRoom,
  fetchSoapNotes,
  fetchPatientSoapNotes,
  getAppointmentById,
  getOrCreateConversation,
  saveSoapNote,
  type SoapNoteRecord
} from "@/services/provider/dashboard";
import { useProviderConversation } from "@/hooks/use-provider-conversation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const PREVIEW_MESSAGES = [
  {
    id: "preview-doctor-1",
    sender_id: "doctor-preview",
    recipient_id: "patient-preview",
    content: "Please upload your latest ECG before tomorrow's review so I can compare it with the previous result.",
    timeLabel: "Today, 10:12 AM"
  },
  {
    id: "preview-patient-1",
    sender_id: "patient-preview",
    recipient_id: "doctor-preview",
    content: "Sure doctor, I have uploaded it and also added the symptoms I noticed this week.",
    timeLabel: "Today, 10:19"
  }
] as const;


export default function ConsultationPage() {
  const params = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const appointmentId = params.appointmentId;

  const [patientId, setPatientId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [chatValue, setChatValue] = useState("");
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [savedNotes, setSavedNotes] = useState<SoapNoteRecord[]>([]);
  const [soapHistory, setSoapHistory] = useState<SoapNoteRecord[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<SoapNoteRecord | null>(null);
  const [isSoapDeleteModalVisible, setIsSoapDeleteModalVisible] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function init() {
      setError("");

      try {
        const appointment = await getAppointmentById(appointmentId);
        setPatientId(appointment.patient_id);

        const [roomResult, convoId, notes, history] = await Promise.allSettled([
          ensureConsultationRoom(appointmentId),
          getOrCreateConversation(appointment.patient_id, appointmentId),
          fetchSoapNotes(appointmentId),
          fetchPatientSoapNotes(appointment.patient_id)
        ]);

        if (roomResult.status === "fulfilled") {
          setMeetingUrl(roomResult.value.meetingUrl);
        }

        if (convoId.status === "fulfilled") {
          setConversationId(convoId.value);
        }

        if (notes.status === "fulfilled") {
          setSavedNotes(notes.value);
        }

        if (history.status === "fulfilled") {
          // Filter out current appointment notes from history to avoid duplication
          setSoapHistory(history.value.filter(n => n.appointment_id !== appointmentId));
        }
      } catch (err) {
        setError((err as Error).message);
      }
    }

    void init();
  }, [appointmentId]);

  useEffect(() => {
    if (!pendingDeleteNote) return;

    const timer = window.setTimeout(() => {
      setIsSoapDeleteModalVisible(true);
    }, 10);

    return () => window.clearTimeout(timer);
  }, [pendingDeleteNote]);

  const { messages, send } = useProviderConversation(conversationId);
  const previewMessages =
    messages.length > 0
      ? messages
      : PREVIEW_MESSAGES;

  async function onSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatValue.trim() || !patientId || !conversationId) return;
    setSending(true);
    setError("");
    try {
      await send(patientId, chatValue);
      setChatValue("");
      setStatus("Message sent to patient.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function onSaveSoap(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const note = await saveSoapNote({
        noteId: editingNoteId ?? undefined,
        appointmentId,
        patientId,
        subjective: soap.subjective,
        objective: soap.objective,
        assessment: soap.assessment,
        plan: soap.plan
      });

      setSavedNotes((prev) => {
        const remaining = prev.filter((item) => item.id !== note.id);
        return [note, ...remaining].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      });
      setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
      setEditingNoteId(null);
      setStatus(editingNoteId ? "SOAP note updated." : "SOAP note saved.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onDeleteSoap(noteId: string) {
    setError("");
    try {
      await deleteSoapNote(noteId);
      setSavedNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
      }
      setStatus("SOAP note deleted.");
      closeSoapDeleteModal();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function onEditSoap(note: SoapNoteRecord) {
    setEditingNoteId(note.id);
    setSoap({
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan
    });
    setStatus("Editing saved SOAP note.");
  }

  function closeSoapDeleteModal() {
    setIsSoapDeleteModalVisible(false);
    window.setTimeout(() => {
      setPendingDeleteNote(null);
    }, 220);
  }

  return (
    <main className="space-y-6 pb-8">
      {pendingDeleteNote && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4 backdrop-blur-sm transition-all duration-200 ${
            isSoapDeleteModalVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-[1.75rem] border border-border/60 bg-background p-6 shadow-2xl transition-all duration-200 ${
              isSoapDeleteModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-destructive">Confirm Delete</p>
            <h2 className="mt-3 text-xl font-black tracking-tight">Delete SOAP note?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will permanently remove the saved SOAP note from this consultation.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeSoapDeleteModal}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => void onDeleteSoap(pendingDeleteNote.id)}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[2rem] bg-[#0F172A] p-6 text-white shadow-2xl md:p-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge className="rounded-full border-none bg-sky-400/15 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300 hover:bg-sky-400/20">
              Live Consultation
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Doctor Consultation Workspace</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Run the video call, share chat updates, and capture SOAP notes from one focused clinical workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">Messages</p>
              <p className="mt-2 text-2xl font-black text-white">{messages.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">SOAP Notes</p>
              <p className="mt-2 text-2xl font-black text-white">{savedNotes.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">Status</p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                {meetingUrl ? "Ready" : "Loading"}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/12 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-[90px]" />
      </section>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm font-medium text-muted-foreground">Consultation workspace</p>
      </div>

      {(status || error) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-300"}`}>
          {error || status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="overflow-hidden rounded-[2rem] border-border/40 bg-background/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-3 space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                <Video className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                Video Consultation
              </CardTitle>
              <p className="text-xs font-medium text-muted-foreground">Secure call room for live provider-patient review.</p>
            </div>
            <Badge variant="outline" className="rounded-xl border-sky-500/20 px-3 text-[10px] font-black text-sky-600 dark:text-sky-300">
              {meetingUrl ? "Connected" : "Preparing"}
            </Badge>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {meetingUrl ? (
              <iframe
                title="Daily consultation room"
                src={meetingUrl}
                className="h-[480px] w-full rounded-[1.5rem] border border-sky-500/15 bg-muted/20 shadow-sm"
                allow="camera; microphone; fullscreen; display-capture"
              />
            ) : (
              <div className="flex h-[480px] items-center justify-center rounded-[1.5rem] border border-dashed border-sky-500/20 bg-sky-500/5">
                <p className="text-sm font-medium text-muted-foreground">Preparing meeting room...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/40 bg-background/70 shadow-sm">
          <CardHeader className="p-6 pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <MessageSquareText className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  Doctor-Patient Chat
                </CardTitle>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Share quick instructions, follow-up tasks, and care updates during the consultation.</p>
              </div>
              <Badge variant="outline" className="rounded-xl border-sky-500/20 px-3 text-[10px] font-black text-sky-600 dark:text-sky-300">
                Secure Channel
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-2">
            <div className="rounded-[1.5rem] border border-border/50 bg-gradient-to-b from-sky-500/[0.04] via-background to-background p-3">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-sky-500/15 bg-background/80 px-4 py-2.5 backdrop-blur">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">Conversation Flow</p>
                  <p className="text-xs text-muted-foreground">
                    {messages.length > 0 ? "Live consultation messages" : "Sample conversation preview until messages arrive"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                </div>
              </div>
              <div className="max-h-[340px] space-y-3 overflow-auto pr-1">
                {previewMessages.map((message) => {
                  const isPatient = message.sender_id === patientId || message.sender_id === "patient-preview";
                  const timeLabel =
                    "timeLabel" in message ? message.timeLabel : new Date(message.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short", hour12: false });

                  return (
                    <div key={message.id} className={`flex ${isPatient ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[88%] rounded-[1.35rem] border px-4 py-3 text-sm shadow-sm ${
                          isPatient
                            ? "border-border/50 bg-background text-foreground"
                            : "border-sky-500/20 bg-gradient-to-br from-sky-500/[0.14] to-cyan-400/[0.10] text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                              isPatient ? "text-muted-foreground" : "text-sky-700 dark:text-sky-300"
                            }`}
                          >
                            {isPatient ? "Patient" : "Doctor"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{timeLabel}</p>
                        </div>
                        <p className="mt-2 leading-6">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <form onSubmit={onSendMessage} className="flex gap-2">
              <Input
                value={chatValue}
                onChange={(e) => setChatValue(e.target.value)}
                placeholder="Type message"
                className="rounded-xl border-sky-500/20 focus-visible:ring-sky-500/20"
              />
              <Button type="submit" disabled={sending} className="rounded-xl bg-sky-600 px-5 font-black text-white shadow-lg shadow-sky-500/20 hover:bg-sky-700">
                {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-border/40 bg-background/70 shadow-sm">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
            <FileText className="h-5 w-5 text-sky-600 dark:text-sky-300" />
            Clinical Notes (SOAP)
          </CardTitle>
          <p className="text-xs font-medium text-muted-foreground">Capture structured clinical findings and maintain a clear consultation record.</p>
        </CardHeader>
        <CardContent className="grid items-start gap-6 p-6 pt-2 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-border/50 bg-muted/10 p-5 xl:sticky xl:top-6 xl:self-start">
            <div className="mb-4">
              <p className="font-black uppercase tracking-[0.18em] text-[11px] text-muted-foreground">Live SOAP note</p>
              <p className="mt-1 text-xs text-muted-foreground">Document the current consultation findings here.</p>
            </div>
            <form onSubmit={onSaveSoap} className="grid gap-4 md:grid-cols-2">
              <Textarea className="min-h-[140px] rounded-2xl" placeholder="Subjective" value={soap.subjective} onChange={(e) => setSoap((p) => ({ ...p, subjective: e.target.value }))} required />
              <Textarea className="min-h-[140px] rounded-2xl" placeholder="Objective" value={soap.objective} onChange={(e) => setSoap((p) => ({ ...p, objective: e.target.value }))} required />
              <Textarea className="min-h-[140px] rounded-2xl" placeholder="Assessment" value={soap.assessment} onChange={(e) => setSoap((p) => ({ ...p, assessment: e.target.value }))} required />
              <Textarea className="min-h-[140px] rounded-2xl" placeholder="Plan" value={soap.plan} onChange={(e) => setSoap((p) => ({ ...p, plan: e.target.value }))} required />
              <div className="flex items-center gap-3 md:col-span-2">
                <Button type="submit" className="rounded-xl font-black shadow-lg shadow-primary/15">
                  {editingNoteId ? "Update SOAP Note" : "Save SOAP Note"}
                </Button>
                {editingNoteId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setEditingNoteId(null);
                      setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
                      setStatus("SOAP form reset.");
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-border/50 bg-muted/10 p-5 space-y-6">
            <div className="flex items-center justify-between">
              <p className="font-black uppercase tracking-[0.18em] text-[11px] text-muted-foreground">Saved SOAP notes</p>
              <Badge variant="outline" className="rounded-xl border-sky-500/20 px-3 text-[10px] font-black text-sky-600 dark:text-sky-300">
                {savedNotes.length} saved
              </Badge>
            </div>

            {savedNotes.length === 0 && (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                No saved SOAP notes yet for this consultation. Preview history stays visible below for reference.
              </div>
            )}

            {savedNotes.length > 0 && (
              <div className="space-y-4">
                {savedNotes.map((note) => (
                  <div key={note.id} className="rounded-[1.5rem] border border-border/50 bg-muted/10 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">Saved note</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(note.updated_at).toLocaleString([], { dateStyle: "short", timeStyle: "short", hour12: false })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEditSoap(note)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="destructive" className="rounded-xl" onClick={() => setPendingDeleteNote(note)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border bg-background p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subjective</p>
                        <p className="text-sm">{note.subjective}</p>
                      </div>
                      <div className="rounded-xl border bg-background p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objective</p>
                        <p className="text-sm">{note.objective}</p>
                      </div>
                      <div className="rounded-xl border bg-background p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment</p>
                        <p className="text-sm">{note.assessment}</p>
                      </div>
                      <div className="rounded-xl border bg-background p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan</p>
                        <p className="text-sm">{note.plan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-border/40 bg-background/70 shadow-sm">
        <CardHeader className="p-6 pb-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 text-left"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
          >
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase">Patient Clinical History</CardTitle>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Review historical clinical notes for this patient from previous consultations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-xl border-sky-500/20 px-3 text-[10px] font-black text-sky-600 dark:text-sky-300">
                {soapHistory.length} records
              </Badge>
              <ChevronDown
                className={`h-5 w-5 text-sky-600 transition-transform duration-200 dark:text-sky-300 ${
                  isHistoryOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>
        </CardHeader>
        {isHistoryOpen && (
          <CardContent className="space-y-4 p-6 pt-0">
            {soapHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No previous clinical history found for this patient.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {soapHistory.map((note) => (
                  <div key={note.id} className="rounded-[1.5rem] border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] via-background to-cyan-400/[0.06] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-foreground">Previous Consultation</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.updated_at).toLocaleString([], { dateStyle: "long", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-sky-500/15 bg-background/90 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">Subjective</p>
                        <p className="text-sm">{note.subjective}</p>
                      </div>
                      <div className="rounded-xl border border-sky-500/15 bg-background/90 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">Objective</p>
                        <p className="text-sm">{note.objective}</p>
                      </div>
                      <div className="rounded-xl border border-sky-500/15 bg-background/90 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">Assessment</p>
                        <p className="text-sm">{note.assessment}</p>
                      </div>
                      <div className="rounded-xl border border-sky-500/15 bg-background/90 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">Plan</p>
                        <p className="text-sm">{note.plan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </main>
  );
}
