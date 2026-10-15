"use client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { MemeFeedItem } from "@/src/lib/memes/types";
import { useLanguage } from "../language-provider";
import { CatVoteControls } from "../cats/cat-vote-controls";
import { MemeImage } from "./meme-image";
export function MemeCard({
  item,
  user,
}: {
  item: MemeFeedItem;
  user: User | null;
}) {
  const { t, language } = useLanguage();
  return (
    <article className="cat-card meme-card">
      <div className="meme-card-top">
        <span className="ai-badge">✦ {t("aiCaption")}</span>
        <Link href={`/rants/${item.id}`}>
          <p className="meme-caption">{item.body}</p>
        </Link>
      </div>
      <MemeImage key={item.template.imageUrl} template={item.template} />
      <div className="cat-card-content">
        <Link href={`/rants/${item.id}`}>
          <h2>{item.title}</h2>
        </Link>
        <div className="meme-attribution">
          <a href={item.template.sourceUrl} target="_blank" rel="noreferrer">
            {t("templateSource")} · {item.template.name} ↗
          </a>
          <time dateTime={item.created_at}>
            {new Date(item.created_at).toLocaleDateString(
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
        <div className="cat-card-bottom">
          <CatVoteControls
            id={item.id}
            user={user}
            totals={item.totals}
            myVote={item.myVote}
          />
          {item.canReuse ? (
            <Link className="reuse-small" href={`/create?reuse=${item.id}`}>
              {t("reusePrompt")} ↗
            </Link>
          ) : (
            <Link
              href={`/rants/${item.id}`}
              aria-label={`${t("viewCreation")}: ${item.title}`}
            >
              ↗
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
