"use client";

import Link from "next/link";
import { useProviderPatients } from "@/hooks/use-provider-patients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProviderPatientsPage() {
  const { patients, loading, error } = useProviderPatients();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Patient List</h1>
      <Card>
        <CardHeader><CardTitle>Assigned Patients</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading patients...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !patients.length && <p className="text-sm text-muted-foreground">No patients assigned yet.</p>}
          {!!patients.length && (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Name</th>
                    <th>Age</th>
                    <th>Last Visit</th>
                    <th>Condition</th>
                    <th>Priority</th>
                    <th>Next Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="border-b">
                      <td className="py-2 font-medium">
                        <Link className="text-primary" href={`/dashboard/provider/patient/${patient.id}`}>{patient.name}</Link>
                      </td>
                      <td>{patient.age ?? "-"}</td>
                      <td>{patient.last_visit ? new Date(patient.last_visit).toLocaleString() : "-"}</td>
                      <td>{patient.condition ?? "-"}</td>
                      <td className={patient.priority === "high" ? "text-destructive" : ""}>{patient.priority}</td>
                      <td>{patient.next_appointment ? new Date(patient.next_appointment).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
