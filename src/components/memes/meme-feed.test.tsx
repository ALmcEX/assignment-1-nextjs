import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemeFeed } from "./meme-feed";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
const props = {
  items: [],
  filters: { sort: "latest" as const, window: "week" as const, page: 2 },
  user: null,
  hasMore: true,
  hasError: false,
};
it("keeps filters on pagination and resets page on sort without fake samples", () => {
  render(<MemeFeed {...props} />);
  expect(
    screen.getByRole("link", { name: "Popular" }).getAttribute("href"),
  ).not.toContain("page=");
  expect(
    screen.getByRole("link", { name: /Next page/ }).getAttribute("href"),
  ).toContain("window=week");
  expect(screen.queryByText("Interface sample")).toBeNull();
  expect(screen.queryByLabelText("Score")).toBeNull();
  expect(
    screen.getAllByRole("link", { name: /Create a meme/ }).length,
  ).toBeGreaterThan(0);
});
it("does not hide database errors behind an empty gallery", () => {
  render(<MemeFeed {...props} hasError />);
  expect(screen.getByRole("alert").textContent).toContain("could not load");
  expect(screen.queryByText("No memes published yet.")).toBeNull();
});
