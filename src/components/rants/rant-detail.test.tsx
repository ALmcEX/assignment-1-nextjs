import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RantDetail } from "./rant-detail";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
const rant = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Cat",
  location: "",
  body: "A private-sounding original idea",
  created_at: "2026-10-14T12:00:00Z",
  image_path: null,
  generation_id: null,
  is_example: false,
  imageUrl: null,
  aiImageUrl: "https://storage.example/cat.png",
  comments: [],
  commentsCount: 0,
  commentsPage: 1,
  hasOlderComments: false,
  totals: { upvotes: 0, downvotes: 0, score: 0 },
  myVote: null,
};
it("reuses by owned work ID without putting prompt text in the URL", () => {
  render(<RantDetail rant={rant} user={null} canReuse />);
  expect(
    screen
      .getByRole("link", { name: /Use this idea again/ })
      .getAttribute("href"),
  ).toBe("/create?reuse=33333333-3333-4333-8333-333333333333");
  expect(screen.queryByText("⌖")).toBeNull();
});
it("preserves historical text and hides reuse for unowned creations", () => {
  render(
    <RantDetail
      rant={{ ...rant, aiImageUrl: null, location: "Dorm" }}
      user={null}
    />,
  );
  expect(screen.getByText(rant.body)).toBeTruthy();
  expect(
    screen.queryByRole("link", { name: /Use this idea again/ }),
  ).toBeNull();
});
