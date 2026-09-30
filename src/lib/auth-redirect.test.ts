import { describe, expect, it } from "vitest";
import { getPostAuthPath } from "./auth-redirect";
import type { Profile } from "./profile";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-123",
    firstName: "Ada",
    lastName: "Lovelace",
    avatarPath: null,
    ...overrides,
  };
}

describe("getPostAuthPath", () => {
  it("routes complete profiles to the protected dashboard", () => {
    expect(getPostAuthPath(profile())).toBe("/dashboard");
  });

  it.each([
    { firstName: null },
    { lastName: null },
    { firstName: "" },
    { lastName: "   " },
  ])("routes incomplete profiles to Profile", (overrides) => {
    expect(getPostAuthPath(profile(overrides))).toBe("/profile");
  });
});
