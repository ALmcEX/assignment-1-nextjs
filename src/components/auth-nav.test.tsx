import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { AuthNav } from "./auth-nav";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(cleanup);

const signedInUser: User = {
  id: "user-123",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: { avatar_url: "https://example.com/avatar.png" },
  aud: "authenticated",
  created_at: "2026-09-29T12:00:00.000Z",
  email: "ada@example.com",
  email_confirmed_at: "2026-09-29T12:00:00.000Z",
  phone: "",
  confirmed_at: "2026-09-29T12:00:00.000Z",
  last_sign_in_at: "2026-09-29T12:00:00.000Z",
  role: "authenticated",
  updated_at: "2026-09-29T12:00:00.000Z",
  identities: [],
  factors: [],
  is_anonymous: false,
};

describe("AuthNav", () => {
  it("offers Google sign-in to signed-out visitors", () => {
    render(<AuthNav user={null} />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy();
  });

  it("shows account navigation to signed-in users", () => {
    render(<AuthNav user={signedInUser} />);

    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Profile" }).getAttribute("href")).toBe(
      "/profile",
    );
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe(
      "/dashboard",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});

it("exposes account navigation through a mobile menu",()=>{render(<AuthNav user={signedInUser}/>);const toggle=screen.getByRole("button",{name:"Your account"});expect(toggle.getAttribute("aria-expanded")).toBe("false");fireEvent.click(toggle);expect(toggle.getAttribute("aria-expanded")).toBe("true");expect(screen.getByRole("link",{name:"Profile"}).getAttribute("href")).toBe("/profile");});
