"use client";
import Image from "next/image";
import { MemeImage } from "./meme-image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CaptionCandidate,
  MemeSeed,
  MemeTemplate,
} from "@/src/lib/memes/types";
import {
  readMemeDraft,
  writeMemeDraft,
  clearMemeDraft,
  type MemeFormDraft,
} from "@/src/lib/memes/local-draft";
import { publishMeme } from "@/src/lib/memes/mutations";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser";
import { isUuid } from "@/src/lib/rants/validation";
import { errorKey } from "@/src/lib/i18n";
import { useLanguage } from "../language-provider";
export function MemeComposer({
  userId,
  templates,
  seed,
  textEnabled = false,
}: {
  userId: string;
  templates: MemeTemplate[];
  seed?: MemeSeed;
  textEnabled?: boolean;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState<MemeFormDraft>({
    prompt: "",
    templateId: templates[0]?.id ?? "",
    language,
    title: "",
    location: "",
    ...seed,
  });
  const [candidate, setCandidate] = useState<CaptionCandidate | null>(null);
  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!seed) {
      const saved = readMemeDraft(userId);
      if (saved)
        queueMicrotask(() => {
          if (active) setForm(saved);
        });
    }
    return () => {
      active = false;
    };
  }, [userId, seed]);
  const template = templates.find((t) => t.id === form.templateId);
  const valid = !!form.prompt.trim() && [...form.prompt.trim()].length <= 1000;
  const metadataValid =
    [...form.title.trim()].length <= 120 &&
    [...form.location.trim()].length <= 120;
  function update<K extends keyof MemeFormDraft>(
    key: K,
    value: MemeFormDraft[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
    setStatus(null);
  }
  async function generate() {
    if (pending.current || !textEnabled || !valid || !template) return;
    pending.current = true;
    setBusy("generate");
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/memes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.prompt.trim(),
          templateId: form.templateId,
          language: form.language,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "aiFailed",
        );
      if (
        typeof data.generationId !== "string" ||
        !isUuid(data.generationId) ||
        typeof data.caption !== "string" ||
        !data.caption.trim() ||
        [...data.caption].length > 300 ||
        data.templateId !== form.templateId ||
        data.prompt !== form.prompt.trim() ||
        data.language !== form.language ||
        !data.template ||
        data.template.id !== form.templateId ||
        data.template.imageUrl !== template.imageUrl ||
        data.template.sourceUrl !== template.sourceUrl ||
        typeof data.template.name !== "string" ||
        !data.template.name.trim() ||
        [...data.template.name].length > 120 ||
        typeof data.template.description !== "string" ||
        [...data.template.description].length > 1000 ||
        !Number.isInteger(data.template.width) ||
        data.template.width < 1 ||
        data.template.width > 10000 ||
        !Number.isInteger(data.template.height) ||
        data.template.height < 1 ||
        data.template.height > 10000
      )
        throw new Error("aiFailed");
      setCandidate({ ...data, template: { ...data.template } });
    } catch (e) {
      setError(errorKey(e));
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }
  async function publish() {
    if (pending.current || !candidate || !textEnabled || !metadataValid) return;
    pending.current = true;
    setBusy("publish");
    setError(null);
    try {
      const result = await publishMeme(createBrowserSupabaseClient(), {
        generationId: candidate.generationId,
        title: form.title,
        location: form.location,
      });
      clearMemeDraft(userId);
      router.push(`/rants/${result.id}`);
      router.refresh();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }
  return (
    <main className="studio-shell">
      <Link className="back-link" href="/">
        ← {t("backGallery")}
      </Link>
      <nav className="sort-tabs media-tabs" aria-label={t("creationMode")}><Link href="/create" aria-current="page">{t("aiCaption")}</Link><Link href="/create/image">{t("imageGallery")}</Link></nav>
      <header className="studio-header">
        <p className="eyebrow">CATCANVAS / MEME STUDIO</p>
        <h1>{t("memeStudioTitle")}</h1>
        <p>{t("memeStudioIntro")}</p>
      </header>
      <div className="studio-grid">
        <section className="studio-form">
          <fieldset disabled={!!busy}>
            <label className="field" htmlFor="meme-template">
              {t("memeTemplate")}
              <select
                id="meme-template"
                value={form.templateId}
                onChange={(e) => update("templateId", e.target.value)}
              >
                {templates.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            {template ? (
              <div className="template-thumbnail">
                <Image
                  src={template.imageUrl}
                  width={template.width}
                  height={template.height}
                  unoptimized
                  alt={template.name}
                />
                <a href={template.sourceUrl} target="_blank" rel="noreferrer">
                  {t("templateSource")} ↗
                </a>
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="meme-scene">
                {t("memeScene")} <small>{[...form.prompt].length}/1000</small>
              </label>
              <textarea
                id="meme-scene"
                rows={4}
                placeholder={t("memeScenePlaceholder")}
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
              />
              <small>{t("memePublicHint")}</small>
            </div>
            <label className="field" htmlFor="caption-language">
              {t("captionLanguage")}
              <select
                id="caption-language"
                value={form.language}
                onChange={(e) =>
                  update("language", e.target.value as MemeSeed["language"])
                }
              >
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
              </select>
            </label>
            <label className="field" htmlFor="meme-title">
              {t("optionalTitle")}
              <input
                id="meme-title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
            <label className="field" htmlFor="meme-location">
              {t("optionalLocation")}
              <input
                id="meme-location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </label>
          </fieldset>
          <p className="field-hint">{t("memeQuotaHint")}</p>
          {!textEnabled ? <p className="notice">{t("aiUnavailable")}</p> : null}
          {error ? (
            <p role="alert" className="error-message">
              {t(error)}
            </p>
          ) : null}
          {status ? (
            <p role="status" className="success-message">
              {t(status)}
            </p>
          ) : null}
          <div className="studio-actions">
            <button
              className="primary-button"
              disabled={!!busy || !textEnabled || !valid || !template}
              onClick={generate}
            >
              {t(
                busy === "generate"
                  ? "captionGenerating"
                  : candidate
                    ? "regenerate"
                    : "captionGenerate",
              )}
            </button>
            <button
              className="secondary-button"
              disabled={!!busy}
              onClick={() =>
                setStatus(
                  writeMemeDraft(userId, form)
                    ? "ideaSaved"
                    : "ideaStorageError",
                )
              }
            >
              {t("saveIdea")}
            </button>
            <button
              className="text-button"
              disabled={!!busy}
              onClick={() =>
                setStatus(
                  clearMemeDraft(userId) ? "ideaCleared" : "ideaStorageError",
                )
              }
            >
              {t("clearIdea")}
            </button>
          </div>
        </section>
        <section className="studio-preview" aria-label={t("previewTitle")}>
          <div className="preview-heading">
            <span className="eyebrow">{t("previewTitle")}</span>
            <span className="cat-tags">✦ {t("aiCaption")}</span>
          </div>
          {candidate ? (
            <>
              <p className="meme-caption">{candidate.caption}</p>
              <MemeImage
                key={candidate.template.imageUrl}
                template={candidate.template}
              />
              <p className="preview-scene">
                {t("previewScene")}: {candidate.prompt}
              </p>
              <p className="field-hint">{t("previewSnapshot")}</p>
              <a
                href={candidate.template.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("templateSource")} · {candidate.template.name} ↗
              </a>
            </>
          ) : (
            <div className="meme-preview-empty">
              <span aria-hidden="true">✦</span>
              <h2>{t("captionPreviewEmpty")}</h2>
              <p>{t("captionPreviewHint")}</p>
            </div>
          )}
          <button
            className="primary-button"
            disabled={!!busy || !textEnabled || !candidate || !metadataValid}
            onClick={publish}
          >
            {t(busy === "publish" ? "publishing" : "catPublish")}
          </button>
        </section>
      </div>
    </main>
  );
}
