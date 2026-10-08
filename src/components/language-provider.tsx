'use client';
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { translate, type Language } from '@/src/lib/i18n';
const LanguageContext = createContext<Language>('en');
function snapshot(): Language { try { return localStorage.getItem('city-vent-language') === 'zh-CN' ? 'zh-CN' : 'en'; } catch { return 'en'; } }
function subscribe(listener:()=>void) { window.addEventListener('storage',listener); window.addEventListener('city-vent-language',listener); return ()=>{window.removeEventListener('storage',listener);window.removeEventListener('city-vent-language',listener);}; }
export function LanguageProvider({children}:{children:ReactNode}) {
 const language = useSyncExternalStore(subscribe,snapshot,()=> 'en' as Language);
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
 const language = useContext(LanguageContext);
 return { language, t:(key:string)=>translate(language,key), setLanguage:(value:Language)=>{ try {localStorage.setItem('city-vent-language',value);}catch{} window.dispatchEvent(new Event('city-vent-language')); } };
}
export function Text({id}:{id:string}) {const {t}=useLanguage();return <>{t(id)}</>;}
