import { afterEach, expect, it } from "vitest";
import { readMemeDraft, writeMemeDraft, clearMemeDraft } from "./local-draft";
afterEach(() => localStorage.clear());
const form = {
  prompt: "Scene",
  templateId: "405658",
  language: "en" as const,
  title: "",
  location: "",
};
it("isolates accounts and stores no generation credential", () => {
  expect(
    writeMemeDraft("a", { ...form, generationId: "fake" } as typeof form),
  ).toBe(true);
  expect(readMemeDraft("b")).toBeNull();
  expect(readMemeDraft("a")).toEqual(form);
  clearMemeDraft("a");
  expect(readMemeDraft("a")).toBeNull();
});
it.each([
  "{",
  JSON.stringify({ ...form, templateId: "unknown" }),
  JSON.stringify({ prompt: "old image", breed: "orange" }),
])("ignores malformed or old draft", (value) => {
  localStorage.setItem("catcanvas:meme:v1:a", value);
  expect(readMemeDraft("a")).toBeNull();
});
