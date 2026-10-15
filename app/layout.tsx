import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/src/components/site-header";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { LanguageProvider } from "@/src/components/language-provider";

export const metadata: Metadata = {
  title: "CatCanvas | A world of imagined cats",
  description: "Turn your ideas into AI cat images. Explore, vote, and come back to create something new.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {data:{user}}=await supabase.auth.getUser();
  return (
    <html lang="en">
      <body><LanguageProvider><SiteHeader user={user}/>{children}</LanguageProvider></body>
    </html>
  );
}
