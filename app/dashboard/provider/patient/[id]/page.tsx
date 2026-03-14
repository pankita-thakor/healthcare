"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VitalsChart } from "@/components/provider/vitals-chart";
import { useProviderPatientProfile } from "@/hooks/use-provider-patient-profile";

export default function ProviderPatientProfilePage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const { profile, loading, error } = useProviderPatientProfile(patientId);

  if (loading) return <p className="text-sm text-muted-foreground">Loading patient profile...</p>;
  if (error || !profile) return <p className="text-sm text-destructive">{error ?? "Failed to load patient profile."}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <Button asChild><Link href="/dashboard/provider/patients">Back to patients</Link></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Patient summary</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="font-medium">Age:</span> {profile.age ?? "N/A"}</p>
            <p><span className="font-medium">Current condition:</span> {profile.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Medical history</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{profile.medicalHistory ?? "No medical history recorded."}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Vital signs graph</CardTitle></CardHeader>
        <CardContent>
          <VitalsChart data={profile.vitals} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Uploaded documents</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile.documents.length === 0 && <p className="text-muted-foreground">No documents uploaded.</p>}
            {profile.documents.map((doc) => (
              <div key={doc.id} className="rounded border p-2">
                <p className="font-medium">{doc.title}</p>
                <p className="text-muted-foreground">{new Date(doc.uploaded_at).toLocaleString()}</p>
                <p className="truncate text-xs">{doc.file_path}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Consultation history</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile.consultations.length === 0 && <p className="text-muted-foreground">No consultations yet.</p>}
            {profile.consultations.map((visit) => (
              <div key={visit.id} className="rounded border p-2">
                <p className="font-medium">{new Date(visit.start_time).toLocaleString()}</p>
                <p>Status: {visit.status}</p>
                <p className="text-muted-foreground">{visit.reason ?? "No reason added."}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
