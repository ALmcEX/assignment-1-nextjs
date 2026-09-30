"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { isProfileComplete, type Profile } from "@/src/lib/profile";
import { saveProfile } from "@/src/lib/profile-client";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser";

export type ProfileFormProps = {
  profile: Profile;
  avatarUrl: string | null;
  saved: boolean;
};

export function ProfileForm({ profile, avatarUrl, saved }: ProfileFormProps) {
  const isComplete = isProfileComplete(profile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      await saveProfile(createBrowserSupabaseClient(), {
        formData: new FormData(event.currentTarget),
        currentAvatarPath: profile.avatarPath,
      });
      window.location.assign("/profile?saved=1");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your profile. Please try again.",
      );
      setIsSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {!isComplete ? (
        <p className="completion-prompt">Complete your profile to continue.</p>
      ) : null}
      {saved ? <p role="status">Profile saved.</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      {avatarUrl ? (
        <Image
          className="profile-avatar"
          src={avatarUrl}
          alt="Current profile photo"
          width={112}
          height={112}
          unoptimized
        />
      ) : null}

      <label>
        First name
        <input name="firstName" defaultValue={profile.firstName ?? ""} required />
      </label>

      <label>
        Last name
        <input name="lastName" defaultValue={profile.lastName ?? ""} required />
      </label>

      <label>
        Profile photo
        <input
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
      </label>

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
