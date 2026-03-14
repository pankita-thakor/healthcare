"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteSoapNote,
  ensureConsultationRoom,
  fetchSoapNotes,
  getAppointmentById,
  getOrCreateConversation,
  saveSoapNote,
  type SoapNoteRecord
} from "@/services/provider/dashboard";
import { useProviderConversation } from "@/hooks/use-provider-conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<SoapNoteRecord | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function init() {
      setError("");

      try {
        const appointment = await getAppointmentById(appointmentId);
        setPatientId(appointment.patient_id);

        const [roomResult, convoId, notes] = await Promise.allSettled([
          ensureConsultationRoom(appointmentId),
          getOrCreateConversation(appointment.patient_id, appointmentId),
          fetchSoapNotes(appointmentId)
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
      } catch (err) {
        setError((err as Error).message);
      }
    }

    void init();
  }, [appointmentId]);

  const { messages, send } = useProviderConversation(conversationId);

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

  return (
    <main className="py-2">
      {pendingDeleteNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete SOAP note?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove the saved SOAP note from this consultation.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingDeleteNote(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  const noteId = pendingDeleteNote.id;
                  setPendingDeleteNote(null);
                  void onDeleteSoap(noteId);
                }}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">Consultation workspace</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Video Consultation</CardTitle></CardHeader>
          <CardContent>
            {meetingUrl ? (
              <iframe title="Daily consultation room" src={meetingUrl} className="h-[420px] w-full rounded-lg border" allow="camera; microphone; fullscreen; display-capture" />
            ) : (
              <p className="text-sm text-muted-foreground">Preparing meeting room...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Doctor-Patient Chat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-72 space-y-2 overflow-auto rounded border p-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">No messages yet. Send the first update to the patient.</p>
              )}
              {messages.map((message) => (
                <div key={message.id} className="rounded bg-muted p-2 text-sm">
                  <p className="font-medium">{message.sender_id === patientId ? "Patient" : "Doctor"}</p>
                  <p>{message.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <form onSubmit={onSendMessage} className="flex gap-2">
              <Input value={chatValue} onChange={(e) => setChatValue(e.target.value)} placeholder="Type message" />
              <Button type="submit" disabled={sending}>{sending ? "Sending..." : "Send"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Clinical Notes (SOAP)</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={onSaveSoap} className="grid gap-3 md:grid-cols-2">
            <Textarea placeholder="Subjective" value={soap.subjective} onChange={(e) => setSoap((p) => ({ ...p, subjective: e.target.value }))} required />
            <Textarea placeholder="Objective" value={soap.objective} onChange={(e) => setSoap((p) => ({ ...p, objective: e.target.value }))} required />
            <Textarea placeholder="Assessment" value={soap.assessment} onChange={(e) => setSoap((p) => ({ ...p, assessment: e.target.value }))} required />
            <Textarea placeholder="Plan" value={soap.plan} onChange={(e) => setSoap((p) => ({ ...p, plan: e.target.value }))} required />
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit">{editingNoteId ? "Update SOAP Note" : "Save SOAP Note"}</Button>
              {editingNoteId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingNoteId(null);
                    setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
                    setStatus("SOAP form reset.");
                  }}
                >
                  Cancel Edit
                </Button>
              )}
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
            </div>
          </form>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Saved SOAP notes</p>
              <p className="text-sm text-muted-foreground">{savedNotes.length} saved</p>
            </div>

            {savedNotes.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No SOAP notes saved yet for this consultation.
              </div>
            )}

            {savedNotes.map((note) => (
              <div key={note.id} className="rounded-xl border bg-muted/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Saved note</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(note.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => onEditSoap(note)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteNote(note)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subjective</p>
                    <p className="text-sm">{note.subjective}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objective</p>
                    <p className="text-sm">{note.objective}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment</p>
                    <p className="text-sm">{note.assessment}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan</p>
                    <p className="text-sm">{note.plan}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
