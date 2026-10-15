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
  captions: ["No more deadlines.", "Nap first.", "Not today.", "Office hours closed."],
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
  fireEvent.click(screen.getByRole("button", { name: /No more deadlines/ }));
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
    { generationId: candidate.generationId, choiceIndex: 0, location: "" },
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

it("previews the template snapshot actually returned and persisted by the server", async () => {
  vi.stubGlobal("fetch", async () => ({
    ok: true,
    json: async () => ({
      ...candidate,
      template: { ...candidate.template, name: "Current server template" },
    }),
  }));
  render(<MemeComposer userId="a" templates={templates} textEnabled />);
  fireEvent.change(screen.getByLabelText(/Your scene/), {
    target: { value: "deadline" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate caption" }));
  await screen.findByText("No more deadlines.");
  expect(
    screen.getByRole("img", { name: "Current server template" }),
  ).toBeTruthy();
});


it("requires a choice and publishes the selected one from four buttons", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => candidate }));
  vi.mocked(publishMeme).mockResolvedValue({ id: "published-id" });
  render(<MemeComposer userId="a" templates={templates} textEnabled />);
  fireEvent.change(screen.getByLabelText(/Your scene/), { target: { value: "deadline" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate caption" }));
  await screen.findByText("Nap first.");
  expect(screen.getByRole("button", { name: "Publish creation" }).matches(":disabled")).toBe(true);
  for (const caption of candidate.captions) expect(screen.getByRole("button", { name: new RegExp(caption.replace(".", "\\.")) })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Nap first/ }));
  fireEvent.click(screen.getByRole("button", { name: "Publish creation" }));
  await waitFor(() => expect(publishMeme).toHaveBeenCalledWith({}, { generationId: candidate.generationId, choiceIndex: 1, location: "" }));
  expect(screen.queryByLabelText("Title (optional)")).toBeNull();
});
it("offers a personal photo and rejects unsupported uploads before generation", () => {
  render(<MemeComposer userId="a" templates={templates} textEnabled />);
  fireEvent.click(screen.getByRole("button", { name: "Upload a photo" }));
  const file = screen.getByLabelText("Choose photo");
  fireEvent.change(file, { target: { files: [new File(["bad"], "bad.svg", { type: "image/svg+xml" })] } });
  expect(screen.getByRole("alert")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Generate caption" }).matches(":disabled")).toBe(true);
});

it("sends the chosen photo and shows four captions without using the image-generation endpoint", async () => {
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:photo-preview");
    static revokeObjectURL = vi.fn();
  });
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    ...candidate, templateId: "uploaded", template: { ...candidate.template, id: "uploaded", name: "Your photo", imageUrl: "https://storage.example/photo.png", sourceUrl: "", storagePath: "owner/photo.png" },
  }) });
  vi.stubGlobal("fetch", fetcher);
  render(<MemeComposer userId="a" templates={templates} textEnabled />);
  fireEvent.click(screen.getByRole("button", { name: "Upload a photo" }));
  const photo = new File(["test"], "cat.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Choose photo"), { target: { files: [photo] } });
  fireEvent.change(screen.getByLabelText(/Your scene/), { target: { value: "deadline" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate caption" }));
  await screen.findByText("Nap first.");
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toBe("/api/captions/generate");
  const form = fetcher.mock.calls[0][1].body as FormData;
  expect(form.get("templateId")).toBe("uploaded");
  expect((form.get("photo") as File).name).toBe("cat.png");
  expect(screen.getByRole("button", { name: /Nap first/ })).toBeTruthy();
});
