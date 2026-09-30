import { redirect } from "next/navigation";
import { DashboardPanel } from "@/src/components/dashboard-panel";
import { isProfileComplete, parseProfile } from "@/src/lib/profile";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    redirect("/profile");
  }

  let profile;
  try {
    profile = parseProfile(data);
  } catch {
    redirect("/profile");
  }

  if (!isProfileComplete(profile)) {
    redirect("/profile");
  }

  return (
    <main className="centered-shell">
      <DashboardPanel email={user.email ?? "Email unavailable"} profile={profile} />
    </main>
  );
}
