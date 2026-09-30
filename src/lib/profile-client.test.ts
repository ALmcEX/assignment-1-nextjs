import { afterEach, describe, expect, it, vi } from "vitest";
import { saveProfile, type ProfileBrowserClient } from "./profile-client";

type FakeOptions = {
  userId?: string | null;
  authError?: unknown;
  uploadError?: unknown;
  updateError?: unknown;
};

function fakeClient(options: FakeOptions = {}) {
  const calls: unknown[] = [];
  const userId = options.userId === undefined ? "user-123" : options.userId;

  const client: ProfileBrowserClient = {
    auth: {
      async getUser() {
        calls.push(["getUser"]);
        return {
          data: { user: userId ? { id: userId } : null },
          error: options.authError ?? null,
        };
      },
    },
    storage: {
      from(bucket: string) {
        calls.push(["storage.from", bucket]);
        return {
          async upload(
            path: string,
            file: File,
            uploadOptions: { upsert: boolean; contentType: string },
          ) {
            calls.push(["upload", path, file.name, uploadOptions]);
            return { error: options.uploadError ?? null };
          },
        };
      },
    },
    from(table: string) {
      calls.push(["from", table]);
      return {
        update(values: Record<string, unknown>) {
          calls.push(["update", values]);
          return {
            async eq(column: string, value: string) {
              calls.push(["eq", column, value]);
              return { error: options.updateError ?? null };
            },
          };
        },
      };
    },
  };

  return { client, calls };
}

function profileForm(avatar?: File) {
  const formData = new FormData();
  formData.set("firstName", " Ada ");
  formData.set("lastName", " Lovelace ");
  if (avatar) {
    formData.set("avatar", avatar);
  }
  return formData;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveProfile", () => {
  it("rejects unauthenticated mutations with a safe error", async () => {
    const { client, calls } = fakeClient({
      userId: null,
      authError: { message: "private auth detail" },
    });

    await expect(
      saveProfile(client, { formData: profileForm(), currentAvatarPath: null }),
    ).rejects.toThrow("Please sign in again before saving your profile.");
    expect(calls).toEqual([["getUser"]]);
  });

  it("uploads a valid avatar inside the authenticated user's folder", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000000",
    );
    const avatar = new File(["photo"], "portrait.png", { type: "image/png" });
    const { client, calls } = fakeClient();

    await expect(
      saveProfile(client, { formData: profileForm(avatar), currentAvatarPath: null }),
    ).resolves.toEqual({
      avatarPath: "user-123/00000000-0000-4000-8000-000000000000.png",
    });
    expect(calls).toContainEqual([
      "upload",
      "user-123/00000000-0000-4000-8000-000000000000.png",
      "portrait.png",
      { upsert: false, contentType: "image/png" },
    ]);
    expect(calls).toContainEqual([
      "update",
      {
        first_name: "Ada",
        last_name: "Lovelace",
        avatar_path: "user-123/00000000-0000-4000-8000-000000000000.png",
      },
    ]);
    expect(calls).toContainEqual(["eq", "id", "user-123"]);
  });

  it("preserves the existing avatar when no file is selected", async () => {
    const { client, calls } = fakeClient();

    await expect(
      saveProfile(client, {
        formData: profileForm(),
        currentAvatarPath: "user-123/current.webp",
      }),
    ).resolves.toEqual({ avatarPath: "user-123/current.webp" });
    expect(calls.some((call) => Array.isArray(call) && call[0] === "upload")).toBe(false);
    expect(calls).toContainEqual([
      "update",
      {
        first_name: "Ada",
        last_name: "Lovelace",
        avatar_path: "user-123/current.webp",
      },
    ]);
  });

  it("does not expose Storage error details", async () => {
    const avatar = new File(["photo"], "portrait.png", { type: "image/png" });
    const { client } = fakeClient({ uploadError: { message: "private bucket detail" } });

    await expect(
      saveProfile(client, { formData: profileForm(avatar), currentAvatarPath: null }),
    ).rejects.toThrow("Unable to upload your profile photo. Please try again.");
  });

  it("does not expose database error details", async () => {
    const { client } = fakeClient({ updateError: { message: "private row detail" } });

    await expect(
      saveProfile(client, { formData: profileForm(), currentAvatarPath: null }),
    ).rejects.toThrow("Unable to save your profile. Please try again.");
  });
});
