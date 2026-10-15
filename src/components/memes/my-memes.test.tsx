import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { MyMemes } from "./my-memes";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
it("links an empty personal gallery to creation and preserves pagination", () => {
  render(
    <MyMemes
      items={[]}
      user={{ id: "owner" } as User}
      page={2}
      hasMore
      hasError={false}
    />,
  );
  expect(screen.getByRole("heading", { name: "My creations" })).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /Create a meme/ }).getAttribute("href"),
  ).toBe("/create");
  expect(
    screen.getByRole("link", { name: /Next page/ }).getAttribute("href"),
  ).toBe("/my-cats?page=3");
});
