import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/onboarding", "/consultation"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((route) => pathname.startsWith(route));

  if (!isProtected) return NextResponse.next();

  const userId = request.cookies.get("hf_user")?.value;
  const role = request.cookies.get("hf_role")?.value;

  if (!userId || !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/dashboard/patient") && role !== "patient") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }
  if (pathname.startsWith("/dashboard/provider") && role !== "provider") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (pathname.startsWith("/onboarding/patient") && role !== "patient") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (pathname.startsWith("/consultation") && role !== "provider" && role !== "patient" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/consultation/:path*"]
};
