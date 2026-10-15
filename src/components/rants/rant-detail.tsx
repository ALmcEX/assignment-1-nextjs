"use client";
import { MemeImage } from "../memes/meme-image";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { RantDetail as Detail } from "@/src/lib/rants/types";
import type { CatBreed, CatStyle } from "@/src/lib/rants/cat-options";
import { useLanguage } from "../language-provider";
import { RantInteractions } from "./rant-interactions";
import { breedKey, styleKey } from "../cats/cat-card";
export function RantDetail({
  rant,
  user,
  canReuse = false,
  breed,
  style,
}: {
  rant: Detail;
  user: User | null;
  canReuse?: boolean;
  breed?: CatBreed;
  style?: CatStyle;
}) {
  const { t, language } = useLanguage();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <main className="detail-shell">
      <Link className="back-link" href={rant.ai_image_path ? "/images" : "/"}>
        ← {t("backGallery")}
      </Link>
      <article className="rant-article">
        <div className="detail-meta">
          {rant.location ? <span>⌖ {rant.location}</span> : <span />}
          <time dateTime={rant.created_at}>
            {new Date(rant.created_at).toLocaleDateString(
              language === "en" ? "en-US" : "zh-CN",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "America/New_York",
              },
            )}
          </time>
        </div>
        {!rant.meme_template ? <h1>{rant.title}</h1> : null}
        {rant.generation_id ? (
          <span className="ai-badge">
            ✦{" "}
            {t(
              rant.meme_template
                ? "aiCaption"
                : rant.is_example
                  ? "aiExample"
                  : rant.ai_image_path
                    ? "aiCatGenerated"
                    : "aiGenerated",
            )}
          </span>
        ) : null}
        {rant.aiImageUrl || rant.aiImageError ? (
          <figure className="ai-cat-figure">
            {rant.aiImageError || failedImage === rant.aiImageUrl ? (
              <div className="gallery-state" role="alert">
                <p>{t("imageMissing")}</p>
                <a href={`/rants/${rant.id}`}>{t("retry")}</a>
              </div>
            ) : (
              <Image
                src={rant.aiImageUrl!}
                alt={t("aiPreview")}
                width={1024}
                height={1024}
                unoptimized
                onError={() => setFailedImage(rant.aiImageUrl ?? null)}
              />
            )}
            <figcaption>
              ✦ {t("aiCatGenerated")}
              {breed ? ` · ${t(breedKey[breed])}` : ""}
              {style ? ` · ${t(styleKey[style])}` : ""}
            </figcaption>
          </figure>
        ) : null}
        <p
          className={
            rant.meme_template ? "meme-caption detail-caption" : "rant-body"
          }
        >
          {rant.body}
        </p>
        {rant.meme_template ? (
          <figure className="meme-detail-figure">
            <MemeImage
              key={rant.meme_template.imageUrl}
              template={rant.meme_template}
            />
            <figcaption>
              {rant.meme_template.id === "uploaded" ? <span>{t("uploadedPhoto")}</span> : <a
                href={rant.meme_template.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("templateSource")} · {rant.meme_template.name} ↗
              </a>}
            </figcaption>
            <p className="field-hint">{t("memeScene")}</p>
            <p>{rant.meme_scene}</p>
          </figure>
        ) : null}
        {canReuse ? (
          <Link
            className="primary-link reuse-link"
            href={`${rant.ai_image_path ? "/create/image" : "/create"}?reuse=${rant.id}`}
          >
            {t("reusePrompt")} ↗
          </Link>
        ) : null}
        {rant.imageUrl ? (
          <div className="rant-photo">
            <Image
              src={rant.imageUrl}
              alt={rant.title}
              width={1000}
              height={750}
              unoptimized
            />
          </div>
        ) : null}
      </article>
      <RantInteractions
        rantId={rant.id}
        user={user}
        myVote={rant.myVote}
        totals={rant.totals}
        comments={rant.comments}
        commentsCount={rant.commentsCount}
        commentsPage={rant.commentsPage}
        hasOlderComments={rant.hasOlderComments}
      />
    </main>
  );
}
