"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser";

export function AuthNav({ user }: { user: User | null }) {
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
      setErrorMessage("Unable to start Google sign-in. Please try again.");
      setIsBusy(false);
    }
  }

  async function signOut() {
    setIsBusy(true);
    setErrorMessage(null);

    const { error } = await createBrowserSupabaseClient().auth.signOut();
    if (error) {
      setErrorMessage("Unable to sign out right now. Please try again.");
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
          <span className="auth-email">{user.email ?? "Signed in"}</span>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard">Dashboard</Link>
          <button type="button" onClick={signOut} disabled={isBusy}>
            Sign out
          </button>
        </>
      ) : (
        <button type="button" onClick={signIn} disabled={isBusy}>
          Continue with Google
        </button>
      )}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </nav>
  );
}
