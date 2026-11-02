import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/** Only allow same-site relative paths so `next` cannot become an open redirect. */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Could not complete GitHub sign-in:", error);
    return NextResponse.redirect(`${origin}${next}?auth_error=1`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
