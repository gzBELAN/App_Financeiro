import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/expenses", "/categories", "/cards", "/installments", "/subscriptions", "/fixed-expenses", "/goals", "/reports", "/workspace", "/settings"];
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];
const WORKSPACE_FREE_PATHS = ["/workspace", "/settings"];

function hasPathPrefix(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && hasPathPrefix(pathname, PROTECTED_PATHS)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && hasPathPrefix(pathname, AUTH_PATHS) && pathname !== "/reset-password") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && hasPathPrefix(pathname, PROTECTED_PATHS) && !hasPathPrefix(pathname, WORKSPACE_FREE_PATHS)) {
    const { count } = await supabase.from("workspace_members").select("workspace_id", { count: "exact", head: true });
    if (!count) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/workspace";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}