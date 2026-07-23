import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/entrar", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/entrar", url.origin));
  }

  const requestedNext = url.searchParams.get("next");
  const destination =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? new URL(requestedNext, url.origin)
      : new URL("/", url.origin);

  return NextResponse.redirect(
    destination.origin === url.origin ? destination : new URL("/", url.origin),
  );
}
