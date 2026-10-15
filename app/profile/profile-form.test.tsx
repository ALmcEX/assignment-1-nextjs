import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import type { Profile } from "@/src/lib/profile";
import { ProfileForm } from "./profile-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/src/lib/profile-client", () => ({
  saveProfile: vi.fn(async () => {}),
}));
vi.mock("@/src/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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

    expect(
      (screen.getByLabelText("First name") as HTMLInputElement).value,
    ).toBe("Ada");
    expect((screen.getByLabelText("Last name") as HTMLInputElement).value).toBe(
      "Lovelace",
    );
    expect(
      screen.getByRole("img", { name: "Current profile photo" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Profile saved.");
  });
});

it("allows a second profile edit after successful saving", async () => {
  const { saveProfile } = await import("@/src/lib/profile-client");
  render(
    <ProfileForm
      profile={profile({ firstName: "Ada", lastName: "Lovelace" })}
      avatarUrl={null}
      saved={false}
    />,
  );
  fireEvent.submit(
    screen.getByRole("button", { name: "Save profile" }).closest("form")!,
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save profile" }).matches(":disabled"),
    ).toBe(false),
  );
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Grace" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Save profile" }).closest("form")!,
  );
  await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(2));
});
