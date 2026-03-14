"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPendingProviders, reviewProvider, type PendingProvider } from "@/services/admin/provider-approval";

export function ProviderApprovalPanel() {
  const [providers, setProviders] = useState<PendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingProviders();
      setProviders(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onReview(userId: string, decision: "active" | "rejected") {
    try {
      await reviewProvider(userId, decision);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider approval queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading pending providers...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !providers.length && <p className="text-sm text-muted-foreground">No pending providers.</p>}
        {providers.map((provider) => (
          <div key={provider.providerId} className="rounded-lg border p-4">
            <p className="font-medium">{provider.name}</p>
            <p className="text-sm text-muted-foreground">{provider.email}</p>
            <p className="mt-2 text-sm">Specialization: {provider.specialization ?? "Not provided"}</p>
            <p className="text-sm">License: {provider.licenseNumber ?? "Not provided"}</p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => onReview(provider.userId, "active")}>Approve</Button>
              <Button variant="destructive" onClick={() => onReview(provider.userId, "rejected")}>Reject</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
