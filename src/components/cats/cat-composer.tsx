"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { catBreeds, catStyles } from "@/src/lib/rants/cat-options";
import type { CatSeed } from "@/src/lib/cats/types";
import {
  readLocalDraft,
  writeLocalDraft,
  clearLocalDraft,
  type CatFormDraft,
} from "@/src/lib/cats/local-draft";
import { publishCat } from "@/src/lib/cats/mutations";
import { isUuid } from "@/src/lib/rants/validation";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/browser";
import { errorKey } from "@/src/lib/i18n";
import { useLanguage } from "../language-provider";

import { breedKey, styleKey } from "./cat-card";
const fingerprint = (f: CatFormDraft) =>
  JSON.stringify([
    f.prompt.trim(),
    f.breed,
    f.style,
    f.language,
    f.location.trim(),
  ]);
export function CatComposer({
  userId,
  imageEnabled = false,
  seed,
}: {
  userId: string;
  imageEnabled?: boolean;
  seed?: CatSeed;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState<CatFormDraft>({
    prompt: "",
    title: "",
    location: "",
    breed: "orange",
    style: "illustration",
    language,
    ...seed,
  });
  const [preview, setPreview] = useState<{
    imageUrl: string;
    generationId: string;
    fingerprint: string;
  } | null>(null);
  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!seed) {
      const saved = readLocalDraft(userId);
      if (saved)
        queueMicrotask(() => {
          if (active) setForm(saved);
        });
    }
    return () => {
      active = false;
    };
  }, [userId, seed]);
  const valid =
    !!form.prompt.trim() &&
    [...form.prompt.trim()].length <= 1000 &&
    [...form.title.trim()].length <= 120 &&
    [...form.location.trim()].length <= 120;
  const stale = !!preview && preview.fingerprint !== fingerprint(form);
  function update<K extends keyof CatFormDraft>(
    key: K,
    value: CatFormDraft[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
    setStatus(null);
  }
  async function generate() {
    if (pending.current || !imageEnabled || !valid) return;
    pending.current = true;
    setBusy("generate");
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.prompt.trim(),
          location: form.location.trim(),
          breed: form.breed,
          style: form.style,
          language: form.language,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "aiFailed",
        );
      if (
        !isUuid(data.generationId) ||
        typeof data.imageUrl !== "string" ||
        !data.imageUrl.startsWith("https://")
      )
        throw new Error("aiFailed");
      setPreview({
        imageUrl: data.imageUrl,
        generationId: data.generationId,
        fingerprint: fingerprint(form),
      });
    } catch (e) {
      setError(errorKey(e));
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }
  async function publish() {
    if (pending.current || !preview || stale || !imageEnabled || !valid) return;
    pending.current = true;
    setBusy("publish");
    setError(null);
    try {
      const result = await publishCat(createBrowserSupabaseClient(), {
        generationId: preview.generationId,
        title: form.title,
        location: form.location,
      });
      clearLocalDraft(userId);
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
      <Link className="back-link" href="/images">
        ← {t("backGallery")}
      </Link>
      <nav className="sort-tabs media-tabs" aria-label={t("creationMode")}><Link href="/create">{t("aiCaption")}</Link><Link href="/create/image" aria-current="page">{t("imageGallery")}</Link></nav>
      <header className="studio-header">
        <p className="eyebrow">CATCANVAS / STUDIO</p>
        <h1>{t("studioTitle")}</h1>
        <p>{t("studioIntro")}</p>
      </header>
      <div className="studio-grid">
        <section className="studio-form">
          <fieldset disabled={!!busy}>
            <div className="field scene-field">
              <label htmlFor="cat-scene">
                {t("scene")} <small>{[...form.prompt].length}/1000</small>
              </label>
              <textarea
                id="cat-scene"
                rows={5}
                value={form.prompt}
                placeholder={t("scenePlaceholder")}
                onChange={(e) => update("prompt", e.target.value)}
              />
              <small>{t("publicSceneHint")}</small>
            </div>
            <div className="cat-options">
              <label htmlFor="cat-type">
                {t("catBreed")}
                <select
                  id="cat-type"
                  value={form.breed}
                  onChange={(e) =>
                    update("breed", e.target.value as CatFormDraft["breed"])
                  }
                >
                  {catBreeds.map((b) => (
                    <option key={b} value={b}>
                      {t(breedKey[b])}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="cat-art-style">
                {t("catStyle")}
                <select
                  id="cat-art-style"
                  value={form.style}
                  onChange={(e) =>
                    update("style", e.target.value as CatFormDraft["style"])
                  }
                >
                  {catStyles.map((s) => (
                    <option key={s} value={s}>
                      {t(styleKey[s])}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field">
              <label htmlFor="cat-output-language">{t("language")}</label>
              <select
                id="cat-output-language"
                value={form.language}
                onChange={(e) =>
                  update("language", e.target.value as CatFormDraft["language"])
                }
              >
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
              </select>
            </div>
            <details className="optional-fields">
              <summary>
                {t("optionalTitle")} / {t("optionalLocation")}
              </summary>
              <div className="field">
                <label htmlFor="cat-title">{t("optionalTitle")}</label>
                <input
                  id="cat-title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="cat-location">{t("optionalLocation")}</label>
                <input
                  id="cat-location"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </div>
            </details>
            <button
              className="generate-button"
              type="button"
              disabled={!imageEnabled || !!busy || !valid}
              onClick={generate}
            >
              <span aria-hidden="true">&#10022;</span>{" "}
              {t(
                busy === "generate"
                  ? "generating"
                  : preview
                    ? "regenerate"
                    : "generate",
              )}
            </button>
            {!imageEnabled ? (
              <p className="generation-note">{t("generationOff")}</p>
            ) : (
              <p className="generation-note">{t("imageBudgetHint")}</p>
            )}
            <div className="draft-actions">
              <button
                className="text-button"
                type="button"
                disabled={!!busy || !valid}
                onClick={() =>
                  setStatus(
                    writeLocalDraft(userId, form)
                      ? "ideaSaved"
                      : "ideaStorageError",
                  )
                }
              >
                {t("saveIdea")}
              </button>
              <button
                className="text-button"
                type="button"
                disabled={!!busy}
                onClick={() =>
                  setStatus(
                    clearLocalDraft(userId)
                      ? "ideaCleared"
                      : "ideaStorageError",
                  )
                }
              >
                {t("clearIdea")}
              </button>
            </div>
          </fieldset>
          {status ? (
            <p role="status" className="draft-status">
              {t(status)}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="error-panel">
              {t(error)}
            </p>
          ) : null}
        </section>
        <section className="studio-preview">
          <div className="preview-label">
            <span>{t("previewTitle")}</span>
            <span>01 / 01</span>
          </div>
          <div className="preview-canvas">
            {preview ? (
              <Image
                src={preview.imageUrl}
                width={1024}
                height={1024}
                alt={t("aiPreview")}
                unoptimized
              />
            ) : (
              <div className="preview-placeholder">
                <span className="empty-spark" aria-hidden="true">✦</span>
                <h2>{t("previewEmpty")}</h2>
                <p>{t("previewHint")}</p>
              </div>
            )}
          </div>
          {preview ? (
            <div className="preview-actions">
              <button
                className="text-button"
                type="button"
                disabled={!!busy}
                onClick={() => setPreview(null)}
              >
                {t("discardAi")}
              </button>
              {stale ? (
                <p className="generation-note">{t("stalePreview")}</p>
              ) : null}
            </div>
          ) : null}
          <button
            className="publish-cat"
            type="button"
            disabled={!preview || stale || !imageEnabled || !!busy || !valid}
            onClick={publish}
          >
            {t(busy === "publish" ? "publishing" : "catPublish")} ↗
          </button>
        </section>
      </div>
    </main>
  );
}
