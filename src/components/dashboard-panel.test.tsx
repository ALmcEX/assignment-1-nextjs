import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Profile } from "@/src/lib/profile";
import { DashboardPanel } from "./dashboard-panel";

afterEach(cleanup);

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-123",
    firstName: "Ada",
    lastName: "Lovelace",
    avatarPath: null,
    ...overrides,
  };
}

describe("DashboardPanel", () => {
  it("renders gated account details and navigation", () => {
    render(<DashboardPanel email="ada@example.com" profile={profile()} />);

    expect(screen.getByRole("heading", { name: "Members-only dashboard" })).toBeTruthy();
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Edit profile" }).getAttribute("href")).toBe(
      "/profile",
    );
    expect(screen.getByRole("link", { name: "Course catalog" }).getAttribute("href")).toBe(
      "/courses",
    );
  });

  it("asks incomplete users to finish their profile without inventing a name", () => {
    render(
      <DashboardPanel
        email="student@example.com"
        profile={profile({ firstName: null, lastName: null })}
      />,
    );

    expect(screen.getByText("Complete your profile to unlock your dashboard.")).toBeTruthy();
    expect(screen.queryByText("null null")).toBeNull();
  });
});
