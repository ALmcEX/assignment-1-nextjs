"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemeImage } from "./meme-image";
import type { CaptionChoices, MemeSeed, MemeTemplate } from "@/src/lib/memes/types";
import { readMemeDraft, writeMemeDraft, clearMemeDraft, type MemeFormDraft } from "@/src/lib/memes/local-draft";
import { publishMeme } from "@/src/lib/memes/mutations";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser";
import { isUuid } from "@/src/lib/rants/validation";
import { errorKey } from "@/src/lib/i18n";
import { useLanguage } from "../language-provider";

export function MemeComposer({ userId, templates, seed, textEnabled = false }: {
  userId: string; templates: MemeTemplate[]; seed?: MemeSeed; textEnabled?: boolean;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState<MemeFormDraft>({ prompt: "", templateId: templates[0]?.id ?? "", language, title: "", location: "", ...seed });
  const [source, setSource] = useState<"preset" | "upload">(seed?.photoTemplate ? "upload" : "preset");
  const [reusePhoto, setReusePhoto] = useState(!!seed?.photoTemplate);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
  const [candidate, setCandidate] = useState<CaptionChoices | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    if (!seed) { const saved = readMemeDraft(userId); if (saved) queueMicrotask(() => { if (active) setForm(saved); }); }
    return () => { active = false; };
  }, [userId, seed]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  const template = templates.find(v => v.id === form.templateId);
  const valid = !!form.prompt.trim() && [...form.prompt.trim()].length <= 1000 && (source === "upload" ? !!photo || reusePhoto : !!template);
  const metadataValid = [...form.location.trim()].length <= 120;
  function update<K extends keyof MemeFormDraft>(key: K, value: MemeFormDraft[K]) {
    setForm(f => ({ ...f, [key]: value })); setError(null); setStatus(null);
  }
  function choosePhoto(file?: File) {
    setError(null); setStatus(null); setReusePhoto(false); setPhoto(null); setPhotoUrl(""); setDimensions({ width: 1000, height: 1000 });
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 3 * 1024 * 1024) { setError("captionPhotoInvalid"); return; }
    setPhoto(file); setPhotoUrl(URL.createObjectURL(file));
  }
  async function generate() {
    if (pending.current || !textEnabled || !valid) return;
    pending.current = true; setBusy("generate"); setError(null); setStatus(null);
    try {
      const body = new FormData();
      body.set("prompt", form.prompt.trim()); body.set("language", form.language);
      body.set("templateId", source === "upload" ? "uploaded" : form.templateId);
      if (source === "upload" && photo) {
        body.set("photo", photo); body.set("width", String(dimensions.width)); body.set("height", String(dimensions.height));
      }
      if (source === "upload" && reusePhoto && !photo && seed?.photoGenerationId) body.set("reuseGenerationId", seed.photoGenerationId);
      const response = await fetch("/api/captions/generate", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "aiFailed");
      if (!isUuid(String(data.generationId)) || !Array.isArray(data.captions) || data.captions.length !== 4 ||
        data.captions.some((c: unknown) => typeof c !== "string" || !c.trim() || [...c].length > 300) ||
        new Set(data.captions.map((c: string) => c.trim().toLowerCase())).size !== 4 ||
        data.prompt !== form.prompt.trim() || data.language !== form.language ||
        data.templateId !== (source === "upload" ? "uploaded" : form.templateId) ||
        data.template?.id !== data.templateId || typeof data.template?.imageUrl !== "string" || !data.template.imageUrl.startsWith("https://") ||
        !Number.isInteger(data.template.width) || !Number.isInteger(data.template.height) ||
        data.template.width < 1 || data.template.width > 10000 || data.template.height < 1 || data.template.height > 10000)
        throw new Error("aiFailed");
      setCandidate(data); setSelected(null);
    } catch (e) { setError(errorKey(e)); }
    finally { pending.current = false; setBusy(null); }
  }
  async function publish() {
    if (pending.current || !candidate || selected === null || !textEnabled || !metadataValid) return;
    pending.current = true; setBusy("publish"); setError(null);
    try {
      const result = await publishMeme(createBrowserSupabaseClient(), { generationId: candidate.generationId, choiceIndex: selected, location: form.location });
      clearMemeDraft(userId); router.push(`/rants/${result.id}`); router.refresh();
    } catch (e) { setError(errorKey(e)); }
    finally { pending.current = false; setBusy(null); }
  }
  return <main className="studio-shell">
    <Link className="back-link" href="/">← {t("backGallery")}</Link>
    <nav className="sort-tabs media-tabs" aria-label={t("creationMode")}><Link href="/create" aria-current="page">{t("aiCaption")}</Link><Link href="/create/image">{t("imageGallery")}</Link></nav>
    <header className="studio-header"><p className="eyebrow">CATCANVAS / CAPTION STUDIO</p><h1>{t("memeStudioTitle")}</h1><p>{t("captionStudioIntro")}</p></header>
    <div className="studio-grid">
      <section className="studio-form">
        <fieldset disabled={!!busy}>
          <h2 className="step-heading">{t("captionStepImage")}</h2>
          <div className="source-switch" aria-label={t("captionSource")}>
            <button type="button" className="secondary-button" aria-pressed={source === "preset"} onClick={() => { setSource("preset"); setError(null); }}>{t("presetMemes")}</button>
            <button type="button" className="secondary-button" aria-pressed={source === "upload"} onClick={() => { setSource("upload"); setError(null); }}>{t("captionUploadPhoto")}</button>
          </div>
          {source === "preset" ? <>
            <label className="field" htmlFor="meme-template">{t("memeTemplate")}<select id="meme-template" value={form.templateId} onChange={e => update("templateId", e.target.value)}>
              {templates.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select></label>
            {template ? <div className="template-thumbnail"><Image src={template.imageUrl} width={template.width} height={template.height} unoptimized alt={template.name} /><a href={template.sourceUrl} target="_blank" rel="noreferrer">{t("templateSource")} ↗</a></div> : null}
          </> : <div className="photo-upload-panel">
            <label className="upload-label" htmlFor="caption-photo">{t("captionChoosePhoto")}</label>
            <input id="caption-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => choosePhoto(e.target.files?.[0])} />
            <p className="field-hint">{t("captionPhotoHint")}</p>
            {reusePhoto && seed?.photoTemplate ? <div className="template-thumbnail"><MemeImage template={seed.photoTemplate} /><button className="secondary-button" type="button" onClick={() => choosePhoto()}>{t("captionRemovePhoto")}</button></div> : null}
            {photoUrl ? <div className="template-thumbnail"><Image src={photoUrl} width={dimensions.width} height={dimensions.height} unoptimized alt={t("captionYourPhoto")} onLoad={e => { const image = e.currentTarget; setDimensions({ width: image.naturalWidth, height: image.naturalHeight }); }} /><button className="secondary-button" type="button" onClick={() => choosePhoto()}>{t("captionRemovePhoto")}</button></div> : null}
          </div>}
          <h2 className="step-heading">{t("captionStepScene")}</h2>
          <div className="field"><label htmlFor="meme-scene">{t("memeScene")} <small>{[...form.prompt].length}/1000</small></label>
            <textarea id="meme-scene" rows={4} placeholder={t("memeScenePlaceholder")} value={form.prompt} onChange={e => update("prompt", e.target.value)} />
            <small className="field-hint">{t("captionSceneHint")}</small>
          </div>
          <label className="field" htmlFor="caption-language">{t("captionLanguage")}<select id="caption-language" value={form.language} onChange={e => update("language", e.target.value as MemeSeed["language"])}><option value="en">English</option><option value="zh-CN">简体中文</option></select></label>
          <label className="field" htmlFor="meme-location">{t("optionalLocation")}<input id="meme-location" value={form.location} onChange={e => update("location", e.target.value)} /></label>
        </fieldset>
        <p className="field-hint">{t("captionBatchQuota")}</p>
        {!textEnabled ? <p className="notice">{t("aiUnavailable")}</p> : null}
        {error ? <p role="alert" className="error-message">{t(error)}</p> : null}
        {status ? <p role="status" className="success-message">{t(status)}</p> : null}
        <div className="studio-actions">
          <button className="primary-button" disabled={!!busy || !textEnabled || !valid} onClick={generate}>{t(busy === "generate" ? "captionGenerating" : candidate ? "regenerate" : "captionGenerate")}</button>
          <button className="secondary-button" disabled={!!busy} onClick={() => setStatus(writeMemeDraft(userId, { ...form, title: "" }) ? "ideaSaved" : "ideaStorageError")}>{t("saveIdea")}</button>
          <button className="secondary-button" disabled={!!busy} onClick={() => setStatus(clearMemeDraft(userId) ? "ideaCleared" : "ideaStorageError")}>{t("clearIdea")}</button>
        </div>
        {source === "upload" ? <p className="field-hint">{t("photoDraftHint")}</p> : null}
      </section>
      <section className="studio-preview caption-preview" aria-label={t("previewTitle")}>
        <div className="preview-heading"><h2 className="step-heading">{t("captionStepChoose")}</h2><span className="ai-badge">✦ {t("aiCaption")}</span></div>
        {candidate ? <>
          <MemeImage key={candidate.template.imageUrl} template={candidate.template} />
          <div className="caption-choices" role="group" aria-label={t("chooseCaption")}>
            {candidate.captions.map((caption, index) => <button key={index} type="button" className="caption-choice" aria-pressed={selected === index} disabled={!!busy} onClick={() => setSelected(index)}><span aria-hidden="true" className="choice-number">{String(index + 1).padStart(2, "0")}</span><span>{caption}</span>{selected === index ? <span aria-hidden="true">✓</span> : null}</button>)}
          </div>
          <p className="preview-scene">{t("previewScene")}: {candidate.prompt}</p>
          <p className="field-hint">{t("previewSnapshot")}</p>
          {candidate.template.sourceUrl ? <a href={candidate.template.sourceUrl} target="_blank" rel="noreferrer">{t("templateSource")} · {candidate.template.name} ↗</a> : null}
        </> : <div className="meme-preview-empty"><span aria-hidden="true">✦</span><h2>{t("captionPreviewEmpty")}</h2><p>{t("captionFourHint")}</p></div>}
        <p className="field-hint">{t(selected === null ? "chooseBeforePublish" : "selectedReady")}</p>
        <button className="primary-button publish-cat" disabled={!!busy || !candidate || selected === null || !textEnabled || !metadataValid} onClick={publish}>{t(busy === "publish" ? "publishing" : "catPublish")}</button>
      </section>
    </div>
  </main>;
}
