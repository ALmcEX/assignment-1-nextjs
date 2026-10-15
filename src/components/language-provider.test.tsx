import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./language-provider";
import { PhotoPicker } from "./photo-picker";
afterEach(() => { cleanup(); localStorage.clear(); });
function Probe() { const {t,language}=useLanguage(); return <><p>{t("publish")}</p><span>{language}</span><PhotoPicker name="photo" /></>; }
it("keeps English labels and file controls despite legacy saved preferences", () => {
 localStorage.setItem("city-vent-language", "zh-CN");
 render(<LanguageProvider><Probe/></LanguageProvider>);
 expect(screen.getByText("Publish rant")).toBeTruthy();
 expect(screen.getByRole("button", { name: "Choose photo" })).toBeTruthy();
 expect(screen.getByText("en")).toBeTruthy();
 expect(document.documentElement.lang).toBe("en");
});
