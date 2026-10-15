import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CatFeed } from "./cat-feed";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
const props = {
  items: [],
  filters: { sort: "latest" as const, window: "week" as const, page: 2 },
  user: null,
  hasMore: true,
  hasError: false,
};
it("keeps filters across pages and resets pagination when switching sort", () => {
  render(<CatFeed {...props} />);
  expect(
    screen.getByRole("link", { name: "Popular" }).getAttribute("href"),
  ).not.toContain("page=");
  expect(
    screen.getByRole("link", { name: /Next page/ }).getAttribute("href"),
  ).toContain("window=week");
  expect(screen.queryByText("Interface sample")).toBeNull();
});
it("keeps database errors separate from explicitly requested samples", () => {
  render(<CatFeed {...props} hasError />);
  expect(screen.getByRole("alert").textContent).toContain("could not load");
  expect(screen.queryByText("Interface sample")).toBeNull();
});
it("labels original preview art and does not fabricate numeric votes", () => {
  render(<CatFeed {...props} showSamples />);
  expect(screen.getAllByText("Interface sample")).toHaveLength(4);
  expect(screen.queryByLabelText("Score")).toBeNull();
  expect(screen.getByText(/not images generated live/)).toBeTruthy();
});
