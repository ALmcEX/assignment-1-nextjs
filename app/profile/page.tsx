import Link from "next/link";
import { Text } from "@/src/components/language-provider";
import { redirect } from "next/navigation";
import { parseProfile } from "@/src/lib/profile";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { ProfileForm } from "./profile-form";

const profileColumns = "id, first_name, last_name, avatar_path";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return <ProfileLoadError />;
  }

  let profileRow = existingProfile;
  if (!profileRow) {
    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id })
      .select(profileColumns)
      .single();

    if (insertError || !insertedProfile) {
      return <ProfileLoadError />;
    }

    profileRow = insertedProfile;
  }

  let profile;
  try {
    profile = parseProfile(profileRow);
  } catch {
    return <ProfileLoadError />;
  }

  const avatarUrl = profile.avatarPath
    ? (await supabase.storage.from("avatars").createSignedUrl(profile.avatarPath, 600)).data?.signedUrl ?? null
    : null;
  const { saved } = await searchParams;

  return (
    <main className="centered-shell">
      <section className="profile-panel">
        <p className="eyebrow"><Text id="yourAccount"/></p>
        <h1><Text id="profile"/></h1>
        <p className="intro">
          <Text id="profileIntro"/>
        </p>
        <ProfileForm profile={profile} avatarUrl={avatarUrl} saved={saved === "1"} />
        <Link href="/"><Text id="back"/></Link>
      </section>
    </main>
  );
}

function ProfileLoadError() {
  return (
    <main className="centered-shell">
      <section className="state-panel error-panel" role="alert">
        <h1><Text id="profileUnavailable"/></h1>
        <p><Text id="loadError"/></p>
        <Link href="/"><Text id="returnHome"/></Link>
      </section>
    </main>
  );
}
