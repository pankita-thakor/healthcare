"use client";

import { AppointmentForm } from "@/components/dashboard/appointment-form";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientDashboard } from "@/hooks/use-patient-dashboard";

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

  if (loading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Failed to load dashboard."}</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-gradient-to-r from-emerald-100 to-cyan-50 p-6 dark:from-slate-900 dark:to-slate-800">
        <h1 className="text-2xl font-semibold">{getGreeting()} {getPatientGreetingName(data.patientName)}</h1>
        <p className="text-sm text-muted-foreground">
          Track your care journey, review provider availability, and book your next consultation.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard title="Upcoming Appointments" value={String(data.upcomingAppointments)} change="Scheduled" />
        <MetricsCard title="Unread Messages" value={String(data.unreadMessages)} change="Inbox" />
        <MetricsCard title="Prescriptions" value={String(data.prescriptions)} change="Active" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentForm patientId={data.patientId} defaultProviderId={data.peerProviderId ?? ""} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Medical records</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.medicalRecords
              ? `${data.medicalRecords} records available for review.`
              : "No medical records yet. Seed data will appear here once applied."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next consultation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.nextAppointment
              ? `${new Date(data.nextAppointment).toLocaleString()} with ${data.peerProviderName ?? "your provider"}.`
              : "No upcoming consultations scheduled."}
          </CardContent>
        </Card>
      </div>

      {data.peerProviderId ? (
        <ChatPanel userId={data.patientId} peerId={data.peerProviderId} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No provider conversation is available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
