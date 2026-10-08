import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === "/login" ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/auth/verified" ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Public app pages can be browsed without an account. Keep refreshing an
  // existing Supabase session, but let each API route enforce its own auth and quota.
  try {
    await supabase.auth.getClaims();
  } catch {
    // Authentication outages must not block public page navigation.
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
