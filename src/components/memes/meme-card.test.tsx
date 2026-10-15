import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemeCard } from "./meme-card";
import { findMemeTemplate } from "@/src/lib/memes/templates";
import { LanguageProvider } from "../language-provider";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => {
  cleanup();
  localStorage.clear();
});
const item = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Deadline",
  body: "<b>Nope.</b>",
  location: "",
  created_at: "2026-10-14T12:00:00Z",
  scene: "Deadline tomorrow",
  template: findMemeTemplate("405658")!,
  totals: { upvotes: 0, downvotes: 0, score: 0 },
  myVote: null,
  canReuse: true,
};
it("keeps caption, publication date and source when an image fails and retries", () => {
  render(<MemeCard item={item} user={null} />);
  expect(screen.getByText("<b>Nope.</b>").querySelector("b")).toBeNull();
  expect(screen.getByText(/AI caption/)).toBeTruthy();
  expect(screen.getByText("Oct 14, 2026")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /Template source/ }).getAttribute("href"),
  ).toBe("https://imgflip.com/memetemplate/Grumpy-Cat");
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByText("<b>Nope.</b>")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    "https://imgflip.com/s/meme/Grumpy-Cat.jpg",
  );
  expect(
    screen
      .getByRole("link", { name: /Use this idea again/ })
      .getAttribute("href"),
  ).toContain("/create?reuse=");
  expect(
    screen.getByRole("button", { name: "Continue with Google" }),
  ).toBeTruthy();
});
it("translates labels without changing generated text", () => {
  localStorage.setItem("city-vent-language", "zh-CN");
  render(
    <LanguageProvider>
      <MemeCard item={item} user={null} />
    </LanguageProvider>,
  );
  expect(screen.getByText(/AI 配文/)).toBeTruthy();
  expect(screen.getByRole("link", { name: /模板来源/ })).toBeTruthy();
  expect(screen.getByText("<b>Nope.</b>")).toBeTruthy();
});

it("never repeats the selected caption as a title", () => {
  render(<MemeCard item={{ ...item, title: item.body }} user={null} />);
  expect(screen.getAllByText(item.body)).toHaveLength(1);
  expect(screen.queryByRole("heading")).toBeNull();
});
