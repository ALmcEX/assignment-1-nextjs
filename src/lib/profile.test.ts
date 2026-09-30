import { describe, expect, it } from "vitest";
import {
  isProfileComplete,
  parseProfile,
  parseProfileNames,
  validateAvatar,
} from "./profile";

describe("parseProfile", () => {
  it("maps a valid database row and preserves nullable fields", () => {
    expect(
      parseProfile({
        id: "user-123",
        first_name: "  Ada ",
        last_name: null,
        avatar_path: " user-123/avatar.png ",
      }),
    ).toEqual({
      id: "user-123",
      firstName: "Ada",
      lastName: null,
      avatarPath: "user-123/avatar.png",
    });
  });

  it.each([
    null,
    {},
    { id: "", first_name: null, last_name: null, avatar_path: null },
    { id: "user-123", first_name: 42, last_name: null, avatar_path: null },
    { id: "user-123", first_name: null, last_name: [], avatar_path: null },
    { id: "user-123", first_name: null, last_name: null, avatar_path: false },
  ])("rejects malformed profile rows", (row) => {
    expect(() => parseProfile(row)).toThrow("Supabase returned an invalid profile row");
  });
});

describe("isProfileComplete", () => {
  it("accepts a profile with both names", () => {
    expect(isProfileComplete({ firstName: "Ada", lastName: "Lovelace" })).toBe(true);
  });

  it.each([
    { firstName: null, lastName: "Lovelace" },
    { firstName: "Ada", lastName: null },
    { firstName: "", lastName: "Lovelace" },
    { firstName: "Ada", lastName: "   " },
  ])("rejects missing or blank names", (profile) => {
    expect(isProfileComplete(profile)).toBe(false);
  });
});

describe("parseProfileNames", () => {
  it("trims valid submitted names", () => {
    const formData = new FormData();
    formData.set("firstName", "  Ada ");
    formData.set("lastName", " Lovelace  ");

    expect(parseProfileNames(formData)).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
    });
  });

  it.each([
    ["", "Lovelace"],
    ["Ada", "   "],
  ])("rejects blank submitted names", (firstName, lastName) => {
    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);

    expect(() => parseProfileNames(formData)).toThrow(
      "First and last name are required.",
    );
  });
});

describe("validateAvatar", () => {
  const fiveMegabytes = 5 * 1024 * 1024;

  it.each([null, { name: "", size: 0, type: "" }])(
    "allows an omitted avatar",
    (file) => {
      expect(validateAvatar(file)).toBeNull();
    },
  );

  it.each(["image/jpeg", "image/png", "image/webp", "image/gif"])(
    "accepts %s at the size limit",
    (type) => {
      expect(
        validateAvatar({ name: "avatar.file", size: fiveMegabytes, type }),
      ).toBeNull();
    },
  );

  it("rejects unsupported image types", () => {
    expect(
      validateAvatar({ name: "avatar.svg", size: 200, type: "image/svg+xml" }),
    ).toBe("Please choose a JPEG, PNG, WebP, or GIF image.");
  });

  it("rejects files larger than 5 MB", () => {
    expect(
      validateAvatar({
        name: "avatar.png",
        size: fiveMegabytes + 1,
        type: "image/png",
      }),
    ).toBe("Avatar must be 5 MB or smaller.");
  });
});
