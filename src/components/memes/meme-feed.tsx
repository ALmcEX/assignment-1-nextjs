"use client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { MemeFeedItem } from "@/src/lib/memes/types";
import type { CatFilters } from "@/src/lib/cats/types";
import { catFeedHref } from "@/src/lib/cats/filters";
import { useLanguage } from "../language-provider";
import { CatCard } from "../cats/cat-card";
import type { CatFeedItem } from "@/src/lib/cats/types";
import { MemeCard } from "./meme-card";
export function MemeFeed({
  items,
  filters,
  user,
  hasMore,
  hasError,
  authRequired = false,
  imageItems,
}: {
  items: MemeFeedItem[];
  filters: CatFilters;
  user: User | null;
  hasMore: boolean;
  hasError: boolean;
  authRequired?: boolean;
  imageItems?: CatFeedItem[];
}) {
  const { t } = useLanguage();
  const images = imageItems !== undefined;
  const createHref = images ? "/create/image" : "/create";
  const createLabel = images ? "generate" : "createCat";
  const href = (patch = {}) => catFeedHref(filters,patch,images ? "/images" : "/");
  return (
    <main className="gallery-shell">
      <nav className="sort-tabs media-tabs" aria-label={t("creationMode")}><Link href="/" aria-current={!images ? "page" : undefined}>{t("aiCaption")}</Link><Link href="/images" aria-current={images ? "page" : undefined}>{t("imageGallery")}</Link></nav>
      <section className="gallery-hero meme-hero">
        <div>
          <p className="eyebrow">{t(images ? "galleryEyebrow" : "memeEyebrow")}</p>
          <h1>{t(images ? "galleryTitle" : "memeGalleryTitle")}</h1>
          <p className="gallery-intro">{t(images ? "galleryIntro" : "memeGalleryIntro")}</p>
          <Link className="primary-link" href={createHref}>
            {t(createLabel)} ↗
          </Link>
        </div>
        <div className="meme-hero-note" aria-hidden="true">
          <span>01 / {t(images ? "scene" : "memeTemplate")}</span>
          <span>02 / {t(images ? "aiCatGenerated" : "aiCaption")}</span>
          <span>03 / {t("communityVotes")}</span>
        </div>
      </section>
      {authRequired ? (
        <p role="alert" className="state-panel">
          {t("authRequired")}
        </p>
      ) : null}
      <div className="gallery-toolbar">
        <nav className="sort-tabs" aria-label={t("gallery")}>
          {(["latest", "popular"] as const).map((sort) => (
            <Link
              key={sort}
              aria-current={filters.sort === sort ? "page" : undefined}
              href={href({ sort, page: 1 })}
            >
              {t(sort)}
            </Link>
          ))}
        </nav>
        <nav className="window-tabs" aria-label={t("windowLabel")}>
          {(["week", "month", "year", "all"] as const).map((window) => (
            <Link
              key={window}
              aria-current={filters.window === window ? "page" : undefined}
              href={href({ window, page: 1 })}
            >
              {t(window)}
            </Link>
          ))}
        </nav>
      </div>
      <p className="ranking-note">{t("rankingHint")}</p>
      {hasError ? (
        <div className="gallery-state" role="alert">
          <p>{t("loadError")}</p>
          <Link href={href()}>{t("retry")} ↻</Link>
        </div>
      ) : (images ? imageItems.length : items.length) ? (
        <div className="cat-grid">
          {images ? imageItems.map(item => <CatCard key={item.id} item={item} user={user} />) : items.map((item) => (
            <MemeCard key={item.id} item={item} user={user} />
          ))}
        </div>
      ) : (
        <div className="gallery-state">
          <span className="empty-spark" aria-hidden="true">
            ✦
          </span>
          <h2>{t(images ? "galleryEmpty" : "memeEmpty")}</h2>
          <p>{t("galleryEmptyHint")}</p>
          <Link className="primary-link" href={createHref}>
            {t(createLabel)} ↗
          </Link>
        </div>
      )}
      <nav className="pagination" aria-label={t("page")}>
        {filters.page > 1 ? (
          <Link href={href({ page: filters.page - 1 })}>
            ← {t("previousPage")}
          </Link>
        ) : (
          <span />
        )}
        <span>
          {t("page")} {filters.page}
        </span>
        {hasMore ? (
          <Link href={href({ page: filters.page + 1 })}>
            {t("nextPage")} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <footer className="site-footer">
        <span>CATCANVAS / {t("memeFooter")}</span>
        <Link href="/courses">{t("courses")} ↗</Link>
      </footer>
    </main>
  );
}
