import Link from "next/link";
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

  try {
    const profile = parseProfile(profileRow);
    const avatarUrl = profile.avatarPath
      ? supabase.storage.from("avatars").getPublicUrl(profile.avatarPath).data.publicUrl
      : null;
    const { saved } = await searchParams;

    return (
      <main className="centered-shell">
        <section className="profile-panel">
          <p className="eyebrow">Your account</p>
          <h1>Profile</h1>
          <p className="intro">
            Add your name and an optional photo. Your image is stored in Supabase
            Storage, not in the profiles table.
          </p>
          <ProfileForm profile={profile} avatarUrl={avatarUrl} saved={saved === "1"} />
          <Link href="/">Back to courses</Link>
        </section>
      </main>
    );
  } catch {
    return <ProfileLoadError />;
  }
}

function ProfileLoadError() {
  return (
    <main className="centered-shell">
      <section className="state-panel error-panel" role="alert">
        <h1>Profile unavailable</h1>
        <p>We could not load your profile right now. Please try again.</p>
        <Link href="/">Return home</Link>
      </section>
    </main>
  );
}
