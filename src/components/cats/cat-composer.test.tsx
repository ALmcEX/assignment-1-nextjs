import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CatComposer } from "./cat-composer";
import { publishCat } from "@/src/lib/cats/mutations";
vi.mock("@/src/lib/cats/mutations", () => ({ publishCat: vi.fn() }));
vi.mock("@/src/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
it("allows saving an idea while generation and publication are unavailable", () => {
  render(<CatComposer userId="owner" />);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), {
    target: { value: "A sleepy cat" },
  });
  expect(
    screen
      .getByRole("button", { name: "Generate cat image" })
      .matches(":disabled"),
  ).toBe(true);
  expect(
    screen
      .getByRole("button", { name: /Publish creation/ })
      .matches(":disabled"),
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Save idea on this device" }),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "saved on this device",
  );
});
it("generates without a location and prevents publishing an image after its idea changed", async () => {
  vi.stubGlobal("fetch", async () => ({
    ok: true,
    json: async () => ({
      generationId: "33333333-3333-4333-8333-333333333333",
      imageUrl: "https://storage.example/cat.png",
    }),
  }));
  render(<CatComposer userId="owner" imageEnabled />);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), {
    target: { value: "A cat in space" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate cat image" }));
  await screen.findByRole("img", { name: "Your AI-generated cat" });
  expect(
    screen
      .getByRole("button", { name: /Publish creation/ })
      .matches(":disabled"),
  ).toBe(false);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), {
    target: { value: "A different scene" },
  });
  expect(
    screen
      .getByRole("button", { name: /Publish creation/ })
      .matches(":disabled"),
  ).toBe(true);
  expect(screen.getByText(/idea has changed/)).toBeTruthy();
  expect(publishCat).not.toHaveBeenCalled();
});
it("retains the last successful image after a replacement fails", async () => {
  let n = 0;
  vi.stubGlobal("fetch", async () =>
    ++n === 1
      ? {
          ok: true,
          json: async () => ({
            generationId: "33333333-3333-4333-8333-333333333333",
            imageUrl: "https://storage.example/cat.png",
          }),
        }
      : { ok: false, json: async () => ({ error: "aiFailed" }) },
  );
  render(<CatComposer userId="owner" imageEnabled />);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), {
    target: { value: "A cat" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate cat image" }));
  await screen.findByRole("img", { name: "Your AI-generated cat" });
  fireEvent.click(screen.getByRole("button", { name: "Generate again" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    "https://storage.example/cat.png",
  );
});
it("validates Unicode length without counting emoji twice", async () => {
  render(<CatComposer userId="owner" imageEnabled />);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), {
    target: { value: "🐈".repeat(1000) },
  });
  expect(
    screen
      .getByRole("button", { name: "Generate cat image" })
      .matches(":disabled"),
  ).toBe(false);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), {
    target: { value: "🐈".repeat(1001) },
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Generate cat image" })
        .matches(":disabled"),
    ).toBe(true),
  );
});


it("keeps caption edits separate from generation and publishes only the caption", async () => {
  const request = vi.fn(async (_url: string, _init: RequestInit) => { void _url; void _init; return { ok: true, json: async () => ({
    generationId: "33333333-3333-4333-8333-333333333333",
    imageUrl: "https://storage.example/cat.png",
  }) }; });
  vi.stubGlobal("fetch", request);
  vi.mocked(publishCat).mockResolvedValue({ id: "post" });
  render(<CatComposer userId="owner" imageEnabled />);
  fireEvent.change(screen.getByLabelText(/Generation prompt/), { target: { value: "Private lunar scene" } });
  fireEvent.change(screen.getByLabelText(/Public caption/), { target: { value: "Moon shift" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate cat image" }));
  await screen.findByRole("img", { name: "Your AI-generated cat" });
  expect(JSON.parse(request.mock.calls[0][1].body as string)).not.toHaveProperty("caption");
  fireEvent.change(screen.getByLabelText(/Public caption/), { target: { value: "Late shift" } });
  fireEvent.click(screen.getByRole("button", { name: /Publish creation/ }));
  await waitFor(() => expect(publishCat).toHaveBeenCalledWith({}, expect.objectContaining({ caption: "Late shift" })));
  expect(request).toHaveBeenCalledTimes(1);
});


it("normalizes reused image parameters to English with no language selector", async () => {
 const f=vi.fn().mockResolvedValue({ok:false,json:async()=>({error:"aiFailed"})});
 vi.stubGlobal("fetch",f);
 render(<CatComposer userId="owner" imageEnabled seed={{prompt:"A cat",breed:"orange",style:"illustration",language:"zh-CN"}}/>);
 expect(screen.queryByLabelText("Language")).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Generate cat image"}));
 await screen.findByRole("alert");
 expect(JSON.parse(f.mock.calls[0][1].body).language).toBe("en");
});
