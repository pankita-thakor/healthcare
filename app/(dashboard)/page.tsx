import { RoleRedirect } from "@/components/dashboard/role-redirect";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Redirecting to your workspace...</h1>
      <RoleRedirect />
    </div>
  );
}
