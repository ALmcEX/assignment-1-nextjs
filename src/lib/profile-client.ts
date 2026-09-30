import { parseProfileNames, validateAvatar } from "./profile";

type UserResult = Promise<{
  data: { user: { id: string } | null };
  error: unknown;
}>;

type MutationResult = PromiseLike<{ error: unknown }>;

export type ProfileBrowserClient = {
  auth: {
    getUser(): UserResult;
  };
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        file: File,
        options: { upsert: boolean; contentType: string },
      ): MutationResult;
    };
  };
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): MutationResult;
    };
  };
};

export type ProfileSaveInput = {
  formData: FormData;
  currentAvatarPath: string | null;
};

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function saveProfile(
  client: ProfileBrowserClient,
  input: ProfileSaveInput,
): Promise<{ avatarPath: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error("Please sign in again before saving your profile.");
  }

  const { firstName, lastName } = parseProfileNames(input.formData);
  const avatarValue = input.formData.get("avatar");
  const avatar = avatarValue instanceof File ? avatarValue : null;
  const avatarValidationError = validateAvatar(avatar);
  if (avatarValidationError) {
    throw new Error(avatarValidationError);
  }

  let avatarPath = input.currentAvatarPath;
  if (avatar && avatar.size > 0) {
    const extension = extensionsByMimeType[avatar.type];
    avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await client.storage
      .from("avatars")
      .upload(avatarPath, avatar, {
        upsert: false,
        contentType: avatar.type,
      });

    if (uploadError) {
      throw new Error("Unable to upload your profile photo. Please try again.");
    }
  }

  const { error: updateError } = await client
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      avatar_path: avatarPath,
    })
    .eq("id", user.id);

  if (updateError) {
    throw new Error("Unable to save your profile. Please try again.");
  }

  return { avatarPath };
}
