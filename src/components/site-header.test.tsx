import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";
import { MemeComposer } from "./memes/meme-composer";
import { MemeFeed } from "./memes/meme-feed";
import { LanguageProvider } from "./language-provider";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
it("uses English with no language switch even for a saved Chinese preference", () => {
  window.localStorage.setItem("city-vent-language", "zh-CN");
  render(<LanguageProvider><SiteHeader user={null}/><MemeComposer userId="owner" templates={[]}/></LanguageProvider>);
  expect(screen.getByRole("link", { name: /My creations/ }).getAttribute("href")).toBe("/my-cats");
  expect(screen.queryByLabelText("Language")).toBeNull();
  expect(screen.queryByLabelText("Caption language")).toBeNull();
  fireEvent.change(screen.getByLabelText(/Your scene/), { target: { value: "My original idea" } });
  expect((screen.getByLabelText(/Your scene/) as HTMLTextAreaElement).value).toBe("My original idea");
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
