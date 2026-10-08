"use client";
import Link from "next/link";
import { useLanguage } from "./language-provider";
import { isProfileComplete, type Profile } from "@/src/lib/profile";

export function DashboardPanel({
  email,
  profile,
}: {
  email: string;
  profile: Profile;
}) {
  const {t}=useLanguage();
  const isComplete = isProfileComplete(profile);

  return (
    <section className="dashboard-panel">
      <p className="eyebrow">{t("protectedRoute")}</p>
      <h1>{t("memberDashboard")}</h1>

      {isComplete ? (
        <div className="account-summary">
          <h2>
            {profile.firstName} {profile.lastName}
          </h2>
          <p>{email}</p>
          <p>{t("sessionActive")}</p>
        </div>
      ) : (
        <p className="completion-prompt">
          {t("unlockDashboard")}
        </p>
      )}

      <div className="link-row">
        <Link href="/profile">{t("editProfile")}</Link>
        <Link href="/courses">{t("courses")}</Link>
      </div>
    </section>
  );
}
