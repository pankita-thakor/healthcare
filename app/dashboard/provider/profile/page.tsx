import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountProfileForm } from "@/components/profile/account-profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProviderProfileForm } from "@/components/provider/provider-profile-form";

export default function ProviderProfilePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Provider Profile</h1>
        <p className="text-sm text-muted-foreground">Manage account details, professional information, and password security.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
