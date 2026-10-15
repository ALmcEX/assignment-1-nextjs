import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";
import { MemeComposer } from "./memes/meme-composer";
import { MemeFeed } from "./memes/meme-feed";
import { LanguageProvider, useLanguage } from "./language-provider";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
function Switch() {
  const { setLanguage } = useLanguage();
  return (
    <button onClick={() => setLanguage("zh-CN")}>Switch test language</button>
  );
}
it("links the new destinations and translates actions without changing authored content", () => {
  render(
    <LanguageProvider>
      <SiteHeader user={null} />
      <MemeComposer userId="owner" templates={[]} />
      <Switch />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("link", { name: /My creations/ }).getAttribute("href"),
  ).toBe("/my-cats");
  expect(
    screen.getByRole("link", { name: /Create a meme/ }).getAttribute("href"),
  ).toBe("/create");
  fireEvent.change(screen.getByLabelText(/Your scene/), {
    target: { value: "My original idea" },
  });
  fireEvent.click(screen.getByText("Switch test language"));
  expect(screen.getByRole("button", { name: /保存想法到本机/ })).toBeTruthy();
  expect((screen.getByLabelText(/你的场景/) as HTMLTextAreaElement).value).toBe(
    "My original idea",
  );
});
it("explains why a protected-page visitor was sent home", () => {
  render(
    <MemeFeed
      items={[]}
      filters={{ sort: "latest", window: "all", page: 1 }}
      user={null}
      hasMore={false}
      hasError={false}
      authRequired
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("Please sign in");
});
