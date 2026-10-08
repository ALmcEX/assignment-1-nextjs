import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/src/components/site-header";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { LanguageProvider } from "@/src/components/language-provider";

export const metadata: Metadata = {
  title: "CITY / VENT · Columbia & NYC",
  description: "A place to share the little frustrations of Columbia and New York life.",
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
