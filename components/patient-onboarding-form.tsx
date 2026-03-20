"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { completePatientOnboarding } from "@/services/onboarding/service";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

const fieldClassName =
  "h-12 rounded-2xl border border-slate-200 bg-slate-50/95 px-4 text-sm text-foreground shadow-[0_8px_24px_-20px_rgba(15,23,42,0.28)] transition placeholder:text-slate-400 focus-visible:border-primary/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/90 dark:placeholder:text-muted-foreground/70";

const selectClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/95 px-4 text-sm text-foreground shadow-[0_8px_24px_-20px_rgba(15,23,42,0.28)] transition outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-background/90";

const textareaClassName =
  "min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/95 px-4 py-3 text-sm text-foreground shadow-[0_8px_24px_-20px_rgba(15,23,42,0.28)] transition placeholder:text-slate-400 focus-visible:border-primary/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/90 dark:placeholder:text-muted-foreground/70";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function PatientOnboardingForm() {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [insurance, setInsurance] = useState("");
  const [conditionSummary, setConditionSummary] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    const userId = getCookie("hf_user");
    setIsDemoUser(Boolean(userId?.startsWith("demo-")));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await completePatientOnboarding({
        dob,
        gender,
        phone,
        bloodGroup,
        insurance,
        conditionSummary,
        allergies,
        emergencyContact,
        medicalHistory
      });
      router.push("/dashboard/patient");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isDemoUser && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          You&apos;re using a demo account. Data won&apos;t be saved. Confirm your email and sign in with your real account to complete onboarding.
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">Patient details</h3>
        <p className="text-sm text-muted-foreground">
          Complete your profile so your doctor has the information needed for care.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="patient-dob" className="text-sm font-semibold text-foreground">Date of birth</label>
          <Input
            id="patient-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="patient-gender" className="text-sm font-semibold text-foreground">Gender</label>
          <select
            id="patient-gender"
            className={selectClassName}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="patient-phone" className="text-sm font-semibold text-foreground">Phone number</label>
          <Input
            id="patient-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className={fieldClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="patient-blood" className="text-sm font-semibold text-foreground">Blood group</label>
          <select
            id="patient-blood"
            className={selectClassName}
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            required
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="patient-insurance" className="text-sm font-semibold text-foreground">Insurance</label>
          <Input
            id="patient-insurance"
            value={insurance}
            onChange={(e) => setInsurance(e.target.value)}
            placeholder="e.g. Policy name or ID"
            className={fieldClassName}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="patient-condition" className="text-sm font-semibold text-foreground">Current condition / reason for visit</label>
          <Textarea
            id="patient-condition"
            value={conditionSummary}
            onChange={(e) => setConditionSummary(e.target.value)}
            placeholder="Brief summary of your current health concern or reason for seeking care"
            className={textareaClassName}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="patient-allergies" className="text-sm font-semibold text-foreground">Allergies (if any)</label>
          <Input
            id="patient-allergies"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Penicillin, nuts, latex"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="patient-emergency" className="text-sm font-semibold text-foreground">Emergency contact</label>
          <Input
            id="patient-emergency"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Name and phone number"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="patient-history" className="text-sm font-semibold text-foreground">Medical history</label>
          <Textarea
            id="patient-history"
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            placeholder="Past diagnoses, surgeries, chronic conditions, medications"
            className={textareaClassName}
            required
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="h-12 w-full rounded-2xl text-sm font-bold shadow-lg shadow-primary/20">
        Complete onboarding
      </Button>
    </form>
  );
}
