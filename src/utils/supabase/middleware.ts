import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // refreshing the auth token
  let user = null;

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    console.error("[SUPABASE AUTH UNAVAILABLE]", {
      pathname,
      error,
    });

    if (pathname.startsWith("/pages")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "message",
        "No se pudo conectar con el servicio de autenticacion."
      );
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  if (
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === "/login" || pathname === "/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/pages/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
