"use client";
import { useEffect, type ReactNode } from "react";
import { translate, type Language } from "@/src/lib/i18n";
export function LanguageProvider({children}:{children:ReactNode}) {
 useEffect(() => { document.documentElement.lang = "en"; }, []);
 return <>{children}</>;
}
export function useLanguage() {
 const language: Language = "en";
 return { language, t:(key:string)=>translate(language,key) };
}
export function Text({id}:{id:string}) { const {t}=useLanguage(); return <>{t(id)}</>; }
