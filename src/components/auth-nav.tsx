"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId,useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from './language-provider';
import { createBrowserSupabaseClient } from '@/src/lib/supabase/browser';
export function AuthNav({user}:{user:User|null}) {
 const {t}=useLanguage();const router=useRouter();const menuId=useId();const [accountOpen,setAccountOpen]=useState(false);const [errorMessage,setErrorMessage]=useState<string|null>(null);const [isBusy,setIsBusy]=useState(false);
 async function signIn(){setIsBusy(true);setErrorMessage(null);try{const {error}=await createBrowserSupabaseClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback`}});if(error)throw error;}catch{setErrorMessage('signInError');setIsBusy(false);}}
 async function signOut(){setIsBusy(true);setErrorMessage(null);try{const {error}=await createBrowserSupabaseClient().auth.signOut();if(error)throw error;router.replace('/');router.refresh();setAccountOpen(false);}catch{setErrorMessage('signOutError');}finally{setIsBusy(false);}}
 return <nav className="auth-nav" aria-label={t('yourAccount')}>{user?<><span className="auth-email">{user.email??t('signedIn')}</span><button className="account-toggle" aria-label={t('yourAccount')} aria-expanded={accountOpen} aria-controls={menuId} onClick={()=>setAccountOpen(!accountOpen)} type="button">{t('yourAccount')} ▾</button><div className="account-links" id={menuId} data-open={accountOpen}><Link href="/profile" onClick={()=>setAccountOpen(false)}>{t('profile')}</Link><Link href="/dashboard" onClick={()=>setAccountOpen(false)}>{t('dashboard')}</Link><button type="button" onClick={signOut} disabled={isBusy}>{t('signOut')}</button></div></>:<button type="button" onClick={signIn} disabled={isBusy}>{t('signIn')}</button>}{errorMessage?<p role="alert">{t(errorMessage)}</p>:null}</nav>;
}
