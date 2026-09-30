import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthPath } from "@/src/lib/auth-redirect";
import { parseProfile } from "@/src/lib/profile";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

const profileColumns = "id, first_name, last_name, avatar_path";

function authError(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return authError(request);
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return authError(request);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError(request);
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return authError(request);
  }

  let profileRow = existingProfile;
  if (!profileRow) {
    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id })
      .select(profileColumns)
      .single();

    if (insertError || !insertedProfile) {
      return authError(request);
    }

    profileRow = insertedProfile;
  }

  try {
    const destination = getPostAuthPath(parseProfile(profileRow));
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return authError(request);
  }
}
