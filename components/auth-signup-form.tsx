"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/services/auth/service";
import { useProviderCategories } from "@/hooks/use-provider-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SignupForm() {
  const router = useRouter();
  const { categories, loading } = useProviderCategories();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [experience, setExperience] = useState("");
  const [hospital, setHospital] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isProvider = role === "provider";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await signup({
        name,
        email,
        password,
        role: role as "admin" | "provider" | "patient",
        provider: isProvider
          ? {
              phone,
              license_number: licenseNumber,
              category_id: categoryId,
              experience: Number(experience || 0),
              hospital,
              bio
            }
          : undefined
      });
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="patient">Patient</option>
        <option value="provider">Provider</option>
        <option value="admin">Admin</option>
      </select>

      {isProvider && (
        <div className="space-y-4 rounded-lg border p-4">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required />
          <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="License number" required />
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">{loading ? "Loading categories..." : "Select specialization category"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Experience (years)"
            required
          />
          <Input value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Hospital" required />
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" required />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full">Create account</Button>
    </form>
  );
}
