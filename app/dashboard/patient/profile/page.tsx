import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountProfileForm } from "@/components/profile/account-profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default function PatientProfilePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Patient Profile</h1>
        <p className="text-sm text-muted-foreground">Update your account details and security settings.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountProfileForm />
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
