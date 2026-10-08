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
  it("returns complete profiles to the rant homepage", () => {
    expect(getPostAuthPath(profile())).toBe("/");
  });

  it.each([
    { firstName: null },
    { lastName: null },
    { firstName: "" },
    { lastName: "   " },
  ])("returns incomplete profiles to the rant homepage", (overrides) => {
    expect(getPostAuthPath(profile(overrides))).toBe("/");
  });
});
