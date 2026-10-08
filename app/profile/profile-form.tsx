"use client";

import Image from "next/image";
import { useLanguage } from "@/src/components/language-provider";
import { PhotoPicker } from "@/src/components/photo-picker";
import { errorKey } from "@/src/lib/i18n";
import { useRouter } from "next/navigation";
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
  const {t}=useLanguage();
  const isComplete = isProfileComplete(profile);
  const router = useRouter();
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
      router.replace("/profile?saved=1");
      router.refresh();
    } catch (error) {
      setErrorMessage(errorKey(error));
      setIsSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {!isComplete ? (
        <p className="completion-prompt">{t("completeProfile")}</p>
      ) : null}
      {saved ? <p role="status">{t("profileSaved")}</p> : null}
      {errorMessage ? <p role="alert">{t(errorMessage)}</p> : null}

      {avatarUrl ? (
        <Image
          className="profile-avatar"
          src={avatarUrl}
          alt={t("currentPhoto")}
          width={112}
          height={112}
          unoptimized
        />
      ) : null}

      <label>
        {t("firstName")}
        <input name="firstName" defaultValue={profile.firstName ?? ""} required />
      </label>

      <label>
        {t("lastName")}
        <input name="lastName" defaultValue={profile.lastName ?? ""} required />
      </label>

      <PhotoPicker name="avatar" label="profilePhoto" accept="image/jpeg,image/png,image/webp,image/gif" />

      <button type="submit" disabled={isSaving}>
        {t(isSaving ? "saving" : "saveProfile")}
      </button>
    </form>
  );
}
