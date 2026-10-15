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

it("keeps the story readable when the image fails and offers a fresh page load", async () => {
  const { fireEvent } = await import("@testing-library/react");
  render(<RantDetail rant={rant} user={null} />);
  fireEvent.error(screen.getByRole("img", { name: "Your AI-generated cat" }));
  expect(screen.getByRole("alert").textContent).toContain("Image unavailable");
  expect(
    screen.getByRole("link", { name: "Try again" }).getAttribute("href"),
  ).toBe("/rants/33333333-3333-4333-8333-333333333333");
  expect(screen.getByText(rant.body)).toBeTruthy();
});

it("shows AI caption with real template and public scene while preserving comments", async () => {
  const { findMemeTemplate } = await import("@/src/lib/memes/templates");
  render(
    <RantDetail
      rant={{
        ...rant,
        generation_id: rant.id,
        aiImageUrl: null,
        body: "Nope.",
        meme_template: findMemeTemplate("405658"),
        meme_scene: "Deadline tomorrow",
      }}
      user={null}
    />,
  );
  expect(screen.getByText(/AI caption/)).toBeTruthy();
  expect(screen.getByRole("img", { name: "Grumpy Cat" })).toBeTruthy();
  expect(screen.getByText("Deadline tomorrow")).toBeTruthy();
  expect(screen.getByText("Nope.")).toBeTruthy();
  expect(screen.getByText("The conversation")).toBeTruthy();
});

it("offers recovery before an image URL can be signed without losing the story", () => {
  render(
    <RantDetail
      rant={{
        ...rant,
        aiImageUrl: null,
        aiImageError: true,
        ai_image_path: "author/missing.png",
      }}
      user={null}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("Image unavailable");
  expect(screen.getByText(rant.body)).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Try again" }).getAttribute("href"),
  ).toContain("/rants/");
});

it('routes image reuse and back navigation to image mode',()=>{
 render(<RantDetail rant={{...rant,ai_image_path:'owner/cat.png'}} user={null} canReuse />);
 expect(screen.getByRole('link',{name:/Use this idea again/}).getAttribute('href')).toBe('/create/image?reuse='+rant.id);
 expect(screen.getByRole('link',{name:/Back to gallery/}).getAttribute('href')).toBe('/images');
});
