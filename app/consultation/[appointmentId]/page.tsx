"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ensureConsultationRoom,
  getAppointmentById,
  getOrCreateConversation,
  saveSoapNote
} from "@/services/provider/dashboard";
import { useProviderConversation } from "@/hooks/use-provider-conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ConsultationPage() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = params.appointmentId;

  const [patientId, setPatientId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [chatValue, setChatValue] = useState("");
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function init() {
      const appointment = await getAppointmentById(appointmentId);
      setPatientId(appointment.patient_id);

      const room = await ensureConsultationRoom(appointmentId);
      setMeetingUrl(room.meetingUrl);

      const convoId = await getOrCreateConversation(appointment.patient_id, appointmentId);
      setConversationId(convoId);
    }

    void init();
  }, [appointmentId]);

  const { messages, send } = useProviderConversation(conversationId);

  async function onSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatValue.trim() || !patientId || !conversationId) return;
    await send(patientId, chatValue);
    setChatValue("");
  }

  async function onSaveSoap(e: React.FormEvent) {
    e.preventDefault();
    await saveSoapNote({
      appointmentId,
      patientId,
      subjective: soap.subjective,
      objective: soap.objective,
      assessment: soap.assessment,
      plan: soap.plan
    });
    setStatus("SOAP note saved.");
  }

  return (
    <main className="container py-8">
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
              {messages.map((message) => (
                <div key={message.id} className="rounded bg-muted p-2 text-sm">{message.content}</div>
              ))}
            </div>
            <form onSubmit={onSendMessage} className="flex gap-2">
              <Input value={chatValue} onChange={(e) => setChatValue(e.target.value)} placeholder="Type message" />
              <Button type="submit">Send</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Clinical Notes (SOAP)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSaveSoap} className="grid gap-3 md:grid-cols-2">
            <Textarea placeholder="Subjective" value={soap.subjective} onChange={(e) => setSoap((p) => ({ ...p, subjective: e.target.value }))} required />
            <Textarea placeholder="Objective" value={soap.objective} onChange={(e) => setSoap((p) => ({ ...p, objective: e.target.value }))} required />
            <Textarea placeholder="Assessment" value={soap.assessment} onChange={(e) => setSoap((p) => ({ ...p, assessment: e.target.value }))} required />
            <Textarea placeholder="Plan" value={soap.plan} onChange={(e) => setSoap((p) => ({ ...p, plan: e.target.value }))} required />
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit">Save SOAP Note</Button>
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
