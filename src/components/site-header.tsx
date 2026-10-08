'use client';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { AuthNav } from './auth-nav';
import { useLanguage } from './language-provider';
export function SiteHeader({user}:{user:User|null}) {
 const {t,language,setLanguage}=useLanguage();
 return <header className="site-header"><Link className="wordmark" href="/">CITY<span>/</span>VENT<span className="brand-dot">●</span></Link><nav className="main-nav" aria-label={t('home')}><Link href="/">{t('home')}</Link><Link className="write-link" href="/rants/new">+ {t('newRant')}</Link></nav><div className="header-tools"><details className="language-menu"><summary aria-label={t('language')}>◎ <span>{language==='en'?'EN':'简中'}</span></summary><div><button type="button" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>English</button><button type="button" aria-pressed={language==='zh-CN'} onClick={()=>setLanguage('zh-CN')}>简体中文</button></div></details><AuthNav user={user}/></div></header>;
}
