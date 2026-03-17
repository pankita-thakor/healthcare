"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/services/auth/service";
import { useProviderCategories } from "@/hooks/use-provider-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fieldClassName =
  "h-12 rounded-xl border-border/60 bg-background/80 px-4 text-sm shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/30";

const selectClassName =
  "h-12 w-full rounded-xl border border-input border-border/60 bg-background/80 px-4 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-primary/30";

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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="signup-name" className="text-sm font-semibold text-foreground">
            Full name
          </label>
          <Input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arjun Sharma"
            className={fieldClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-semibold text-foreground">
            Email address
          </label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-semibold text-foreground">
            Password
          </label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            className={fieldClassName}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-role" className="text-sm font-semibold text-foreground">
          Account type
        </label>
        <select id="signup-role" className={selectClassName} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="patient">Patient</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-muted-foreground">Choose the workspace you want to access first.</p>
      </div>

      {isProvider && (
        <div className="space-y-5 rounded-[1.5rem] border border-border/60 bg-muted/30 p-5 sm:p-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Provider details</h3>
            <p className="text-sm text-muted-foreground">Tell us about your professional profile so we can set up your provider workspace.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="provider-phone" className="text-sm font-semibold text-foreground">
                Phone
              </label>
              <Input
                id="provider-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="provider-license" className="text-sm font-semibold text-foreground">
                License number
              </label>
              <Input
                id="provider-license"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="MED-123456"
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="provider-category" className="text-sm font-semibold text-foreground">
                Specialization
              </label>
              <select
                id="provider-category"
                className={selectClassName}
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
            </div>

            <div className="space-y-2">
              <label htmlFor="provider-experience" className="text-sm font-semibold text-foreground">
                Experience
              </label>
              <Input
                id="provider-experience"
                type="number"
                min="0"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="8"
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="provider-hospital" className="text-sm font-semibold text-foreground">
                Hospital or clinic
              </label>
              <Input
                id="provider-hospital"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="City Care Hospital"
                className={fieldClassName}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="provider-bio" className="text-sm font-semibold text-foreground">
                Short bio
              </label>
              <Textarea
                id="provider-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your care philosophy, specialties, and patient focus."
                className="min-h-[120px] rounded-xl border-border/60 bg-background/80 px-4 py-3 text-sm shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/30"
                required
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
        Create account
      </Button>
    </form>
  );
}
