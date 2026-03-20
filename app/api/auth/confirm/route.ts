import { createClient } from "@supabase/supabase-js";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Endpoint for Supabase Auth to confirm email/OTP.
 * This route exchanges the 'code' for a session and sets local auth cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role to ensure profile resolution
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      // Resolve the user's role and status for cookies
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role || data.user.user_metadata.role || "patient";
      const response = NextResponse.redirect(redirectTo);

      // Set cookies for middleware compatibility
      response.cookies.set("hf_user", data.user.id, { path: "/", maxAge: 2592000, sameSite: "lax" });
      response.cookies.set("hf_role", role, { path: "/", maxAge: 2592000, sameSite: "lax" });

      return response;
    }
  }

  // If error, redirect to login with error message
  const errorRedirect = request.nextUrl.clone();
  errorRedirect.pathname = "/login";
  errorRedirect.searchParams.set("error", "Verification link expired or invalid.");
  return NextResponse.redirect(errorRedirect);
}
