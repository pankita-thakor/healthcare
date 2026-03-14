"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { completePatientOnboarding } from "@/services/onboarding/service";

export function PatientOnboardingForm() {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [insurance, setInsurance] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await completePatientOnboarding({ dob, gender, insurance, medicalHistory });
      router.push("/dashboard/patient");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
      <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender" required />
      <Input value={insurance} onChange={(e) => setInsurance(e.target.value)} placeholder="Insurance" required />
      <Textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} placeholder="Medical history" required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full">Complete onboarding</Button>
    </form>
  );
}
