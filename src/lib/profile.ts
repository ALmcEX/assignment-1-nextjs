export type Profile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarPath: string | null;
};

function parseNullableText(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Supabase returned an invalid profile row");
  }

  return value.trim();
}

export function parseProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") {
    throw new Error("Supabase returned an invalid profile row");
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.trim().length === 0) {
    throw new Error("Supabase returned an invalid profile row");
  }

  return {
    id: row.id.trim(),
    firstName: parseNullableText(row.first_name),
    lastName: parseNullableText(row.last_name),
    avatarPath: parseNullableText(row.avatar_path),
  };
}

export function isProfileComplete(
  profile: Pick<Profile, "firstName" | "lastName">,
): boolean {
  return Boolean(profile.firstName?.trim() && profile.lastName?.trim());
}

export function parseProfileNames(formData: FormData) {
  const firstNameValue = formData.get("firstName");
  const lastNameValue = formData.get("lastName");
  const firstName = typeof firstNameValue === "string" ? firstNameValue.trim() : "";
  const lastName = typeof lastNameValue === "string" ? lastNameValue.trim() : "";

  if (!firstName || !lastName) {
    throw new Error("First and last name are required.");
  }

  return { firstName, lastName };
}

const acceptedAvatarTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const maximumAvatarBytes = 5 * 1024 * 1024;

type AvatarFile = Pick<File, "name" | "size" | "type">;

export function validateAvatar(file: AvatarFile | null): string | null {
  if (!file || file.size === 0) {
    return null;
  }

  if (!acceptedAvatarTypes.has(file.type)) {
    return "Please choose a JPEG, PNG, WebP, or GIF image.";
  }

  if (file.size > maximumAvatarBytes) {
    return "Avatar must be 5 MB or smaller.";
  }

  return null;
}
