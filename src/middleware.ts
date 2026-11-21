import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/chat", "/admin"];

// Blocks cross-site form/fetch POSTs to our API (CSRF), e.g. a malicious page silently
// signing a visitor into a number the attacker controls. Browsers always send Origin on
// cross-origin POSTs; requests without one are same-origin or non-browser.
function isCrossSiteWrite(request: NextRequest): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return false;
  if (!request.nextUrl.pathname.startsWith("/api/")) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== request.headers.get("host");
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  if (isCrossSiteWrite(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // "/admin" itself is the admin login page, so it must stay reachable when signed out.
  const needsAuth =
    pathname !== "/admin" &&
    PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (needsAuth && !user && pathname.startsWith("/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify";
    return NextResponse.redirect(url);
  }

  // Admin area additionally requires the is_admin flag.
  if (user && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin && pathname !== "/admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
