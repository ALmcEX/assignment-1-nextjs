"use client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { MemeFeedItem } from "@/src/lib/memes/types";
import type { CatFilters } from "@/src/lib/cats/types";
import { catFeedHref } from "@/src/lib/cats/filters";
import { useLanguage } from "../language-provider";
import { MemeCard } from "./meme-card";
export function MemeFeed({
  items,
  filters,
  user,
  hasMore,
  hasError,
  authRequired = false,
}: {
  items: MemeFeedItem[];
  filters: CatFilters;
  user: User | null;
  hasMore: boolean;
  hasError: boolean;
  authRequired?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <main className="gallery-shell">
      <section className="gallery-hero meme-hero">
        <div>
          <p className="eyebrow">{t("memeEyebrow")}</p>
          <h1>{t("memeGalleryTitle")}</h1>
          <p className="gallery-intro">{t("memeGalleryIntro")}</p>
          <Link className="primary-link" href="/create">
            {t("createCat")} ↗
          </Link>
        </div>
        <div className="meme-hero-note" aria-hidden="true">
          <span>01 / {t("memeTemplate")}</span>
          <span>02 / {t("aiCaption")}</span>
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
              href={catFeedHref(filters, { sort, page: 1 })}
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
              href={catFeedHref(filters, { window, page: 1 })}
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
          <Link href={catFeedHref(filters)}>{t("retry")} ↻</Link>
        </div>
      ) : items.length ? (
        <div className="cat-grid">
          {items.map((item) => (
            <MemeCard key={item.id} item={item} user={user} />
          ))}
        </div>
      ) : (
        <div className="gallery-state">
          <span className="empty-spark" aria-hidden="true">
            ✦
          </span>
          <h2>{t("memeEmpty")}</h2>
          <p>{t("galleryEmptyHint")}</p>
          <Link className="primary-link" href="/create">
            {t("createCat")} ↗
          </Link>
        </div>
      )}
      <nav className="pagination" aria-label={t("page")}>
        {filters.page > 1 ? (
          <Link href={catFeedHref(filters, { page: filters.page - 1 })}>
            ← {t("previousPage")}
          </Link>
        ) : (
          <span />
        )}
        <span>
          {t("page")} {filters.page}
        </span>
        {hasMore ? (
          <Link href={catFeedHref(filters, { page: filters.page + 1 })}>
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
