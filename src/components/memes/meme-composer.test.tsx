import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemeComposer } from "./meme-composer";
import { findMemeTemplate } from "@/src/lib/memes/templates";
import { publishMeme } from "@/src/lib/memes/mutations";
const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
vi.mock("@/src/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));
vi.mock("@/src/lib/memes/mutations", () => ({ publishMeme: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
const templates = [findMemeTemplate("188390779")!, findMemeTemplate("405658")!];
const candidate = {
  generationId: "33333333-3333-4333-8333-333333333333",
  prompt: "deadline",
  language: "en",
  templateId: "188390779",
  caption: "No more deadlines.",
  template: templates[0],
};
it("saves idea while unconfigured and prevents publishing", () => {
  render(<MemeComposer userId="a" templates={templates} />);
  fireEvent.change(screen.getByLabelText(/Your scene/), {
    target: { value: "deadline" },
  });
  expect(
    screen
      .getByRole("button", { name: "Generate caption" })
      .matches(":disabled"),
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Save idea on this device" }),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "saved on this device",
  );
  expect(
    screen
      .getByRole("button", { name: "Publish creation" })
      .matches(":disabled"),
  ).toBe(true);
});
it("publishes the original candidate after form edits and retains it when replacement fails", async () => {
  let calls = 0;
  vi.stubGlobal("fetch", async () =>
    ++calls === 1
      ? { ok: true, json: async () => candidate }
      : { ok: false, json: async () => ({ error: "aiFailed" }) },
  );
  vi.mocked(publishMeme).mockResolvedValue({ id: "published-id" });
  render(<MemeComposer userId="a" templates={templates} textEnabled />);
  fireEvent.change(screen.getByLabelText(/Your scene/), {
    target: { value: "deadline" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate caption" }));
  await screen.findByText("No more deadlines.");
  fireEvent.change(screen.getByLabelText("Meme template"), {
    target: { value: "405658" },
  });
  fireEvent.change(screen.getByLabelText(/Your scene/), {
    target: { value: "different" },
  });
  fireEvent.change(screen.getByLabelText("Caption language"), {
    target: { value: "zh-CN" },
  });
  expect(screen.getByText(/Preview scene: deadline/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Generate again" }));
  await screen.findByRole("alert");
  expect(screen.getByText("No more deadlines.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Publish creation" }));
  await waitFor(() =>
    expect(nav.push).toHaveBeenCalledWith("/rants/published-id"),
  );
  expect(publishMeme).toHaveBeenCalledWith(
    {},
    { generationId: candidate.generationId, title: "", location: "" },
  );
});
it("prevents duplicate generation and disables parameter editing in flight", async () => {
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  render(<MemeComposer userId="a" templates={templates} textEnabled />);
  fireEvent.change(screen.getByLabelText(/Your scene/), {
    target: { value: "deadline" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate caption" }));
  expect(screen.getByLabelText("Meme template").matches(":disabled")).toBe(
    true,
  );
  expect(
    screen
      .getByRole("button", { name: "Generating caption…" })
      .matches(":disabled"),
  ).toBe(true);
});
