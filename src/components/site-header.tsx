"use client";
import Link from "next/link";
import { CatIllustration } from "./cat-illustration";
import type { User } from "@supabase/supabase-js";
import { AuthNav } from "./auth-nav";
import { useLanguage } from "./language-provider";
export function SiteHeader({ user }: { user: User | null }) {
  const { t } = useLanguage();
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="CatCanvas">
        <CatIllustration variant="paw" className="brand-paw" />
        Cat<span>Canvas</span>
      </Link>
      <nav className="main-nav" aria-label={t("gallery")}>
        <Link href="/">{t("gallery")}</Link>
        <Link className="write-link" href="/create">
          {t("createCat")}
        </Link>
        <Link href="/my-cats">{t("myCats")}</Link>
      </nav>
      <div className="header-tools">
        <AuthNav user={user} />
      </div>
    </header>
  );
}
