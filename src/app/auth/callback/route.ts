import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const destination =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? new URL(requestedNext, url.origin)
      : new URL("/", url.origin);

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(
    destination.origin === url.origin ? destination : new URL("/", url.origin),
  );
}
