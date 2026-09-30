import Link from "next/link";
import { isProfileComplete, type Profile } from "@/src/lib/profile";

export function DashboardPanel({
  email,
  profile,
}: {
  email: string;
  profile: Profile;
}) {
  const isComplete = isProfileComplete(profile);

  return (
    <section className="dashboard-panel">
      <p className="eyebrow">Protected route</p>
      <h1>Members-only dashboard</h1>

      {isComplete ? (
        <div className="account-summary">
          <h2>
            {profile.firstName} {profile.lastName}
          </h2>
          <p>{email}</p>
          <p>You can see this page because your Supabase session is active.</p>
        </div>
      ) : (
        <p className="completion-prompt">
          Complete your profile to unlock your dashboard.
        </p>
      )}

      <div className="link-row">
        <Link href="/profile">Edit profile</Link>
        <Link href="/">Course catalog</Link>
      </div>
    </section>
  );
}
