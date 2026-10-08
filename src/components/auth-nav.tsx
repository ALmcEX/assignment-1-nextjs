"use client";

import Link from "next/link";
import { useLanguage } from "./language-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser";

export function AuthNav({ user }: { user: User | null }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function signIn() {
    setIsBusy(true);
    setErrorMessage(null);

    const { error } = await createBrowserSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage("signInError");
      setIsBusy(false);
    }
  }

  async function signOut() {
    setIsBusy(true);
    setErrorMessage(null);

    const { error } = await createBrowserSupabaseClient().auth.signOut();
    if (error) {
      setErrorMessage("signOutError");
      setIsBusy(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <nav className="auth-nav" aria-label="Account">
      {user ? (
        <>
          <span className="auth-email">{user.email ?? t("signedIn")}</span>
          <Link href="/profile">{t("profile")}</Link>
          <Link href="/dashboard">{t("dashboard")}</Link>
          <button type="button" onClick={signOut} disabled={isBusy}>
            {t("signOut")}
          </button>
        </>
      ) : (
        <button type="button" onClick={signIn} disabled={isBusy}>
          {t("signIn")}
        </button>
      )}
      {errorMessage ? <p role="alert">{t(errorMessage)}</p> : null}
    </nav>
  );
}
