import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Profile } from "@/src/lib/profile";
import { ProfileForm } from "./profile-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(cleanup);

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-123",
    firstName: null,
    lastName: null,
    avatarPath: null,
    ...overrides,
  };
}

describe("ProfileForm", () => {
  it("prompts an incomplete user for names and an optional photo", () => {
    render(<ProfileForm profile={profile()} avatarUrl={null} saved={false} />);

    expect(screen.getByText("Complete your profile to continue.")).toBeTruthy();
    expect(screen.getByLabelText("First name")).toBeTruthy();
    expect(screen.getByLabelText("Last name")).toBeTruthy();
    expect(screen.getByLabelText("Profile photo").getAttribute("accept")).toBe(
      "image/jpeg,image/png,image/webp,image/gif",
    );
    expect(screen.getByRole("button", { name: "Save profile" })).toBeTruthy();
  });

  it("renders an existing profile and save confirmation", () => {
    render(
      <ProfileForm
        profile={profile({ firstName: "Ada", lastName: "Lovelace" })}
        avatarUrl="https://example.com/avatar.png"
        saved
      />,
    );

    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Ada");
    expect((screen.getByLabelText("Last name") as HTMLInputElement).value).toBe(
      "Lovelace",
    );
    expect(screen.getByRole("img", { name: "Current profile photo" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Profile saved.");
  });
});
