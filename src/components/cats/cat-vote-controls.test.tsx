import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { CatVoteControls } from "./cat-vote-controls";
import { setVote } from "@/src/lib/rants/mutations";
vi.mock("@/src/lib/rants/mutations", () => ({ setVote: vi.fn() }));
vi.mock("@/src/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const props = {
  id: "cat",
  user: { id: "owner" } as User,
  totals: { upvotes: 4, downvotes: 1, score: 3 },
  myVote: 1 as const,
};
it("marks selection, preserves score on failure and blocks duplicate pending votes", async () => {
  let fail!: (e: Error) => void;
  vi.mocked(setVote).mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  render(<CatVoteControls {...props} />);
  const up = screen.getByRole("button", { name: "Upvote" });
  expect(up.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(up);
  fireEvent.click(up);
  expect(setVote).toHaveBeenCalledTimes(1);
  fail(new Error("mutationFailed"));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Score").textContent).toBe("3");
  expect(refresh).not.toHaveBeenCalled();
});
it("refreshes verified totals after switching a vote", async () => {
  vi.mocked(setVote).mockResolvedValue();
  render(<CatVoteControls {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Downvote" }));
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  expect(setVote).toHaveBeenCalledWith(expect.anything(), "cat", -1);
});
it("requires sign-in for guests", () => {
  render(<CatVoteControls {...props} user={null} />);
  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Upvote" })).toBeNull();
});
