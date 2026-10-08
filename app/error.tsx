'use client';
import { useLanguage } from '@/src/components/language-provider';
export default function ErrorPage({reset}:{reset:()=>void}){const {t}=useLanguage();return <main className="centered-shell"><section className="state-panel" role="alert"><p>{t('loadError')}</p><button onClick={reset}>{t('returnHome')}</button></section></main>;}
