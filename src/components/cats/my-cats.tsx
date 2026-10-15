"use client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { CatFeedItem } from "@/src/lib/cats/types";
import { useLanguage } from "../language-provider";
import { CatCard } from "./cat-card";
export function MyCats({
  items,
  user,
  page,
  hasMore,
  hasError,
}: {
  items: CatFeedItem[];
  user: User;
  page: number;
  hasMore: boolean;
  hasError: boolean;
}) {
  const { t } = useLanguage();
  return (
    <main className="gallery-shell personal-gallery">
      <nav className="sort-tabs media-tabs" aria-label={t("creationMode")}><Link href="/my-cats">{t("aiCaption")}</Link><Link href="/my-images" aria-current="page">{t("imageGallery")}</Link></nav>
      <header className="personal-header">
        <div>
          <p className="eyebrow">CATCANVAS / COLLECTION</p>
          <h1>{t("imageCollection")}</h1>
          <p>{t("myCatsIntro")}</p>
        </div>
        <Link href="/create/image" className="primary-link">
          {t("generate")} ↗
        </Link>
      </header>
      {hasError ? (
        <div className="gallery-state" role="alert">
          <p>{t("loadError")}</p>
          <Link href={`/my-images?page=${page}`}>{t("retry")} ↻</Link>
        </div>
      ) : items.length ? (
        <div className="cat-grid">
          {items.map((item) => (
            <CatCard key={item.id} item={item} user={user} />
          ))}
        </div>
      ) : (
        <div className="gallery-state">
          <h2>{t("myCatsEmpty")}</h2>
        </div>
      )}
      <nav className="pagination" aria-label={t("page")}>
        {page > 1 ? (
          <Link href={`/my-images?page=${page - 1}`}>← {t("previousPage")}</Link>
        ) : (
          <span />
        )}
        <span>
          {t("page")} {page}
        </span>
        {hasMore ? (
          <Link href={`/my-images?page=${page + 1}`}>{t("nextPage")} →</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
