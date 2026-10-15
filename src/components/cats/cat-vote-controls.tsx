'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {User} from '@supabase/supabase-js';
import type {VoteTotals} from '@/src/lib/rants/types';
import {setVote} from '@/src/lib/rants/mutations';
import {createBrowserSupabaseClient} from '@/src/lib/supabase/browser';
import {errorKey} from '@/src/lib/i18n';
import {useLanguage} from '../language-provider';
import {AuthNav} from '../auth-nav';
export function CatVoteControls({id,user,totals,myVote,disabled=false}:{id:string;user:User|null;totals:VoteTotals;myVote:1|-1|null;disabled?:boolean}){
 const {t}=useLanguage();const router=useRouter();const pending=useRef(false);const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
 async function vote(value:1|-1){if(pending.current||disabled)return;pending.current=true;setBusy(true);setError(null);try{await setVote(createBrowserSupabaseClient(),id,value);router.refresh();}catch(e){setError(errorKey(e));}finally{pending.current=false;setBusy(false);}}
 return <div className="cat-voting">{disabled?<span className="muted">{t('sampleVote')}</span>:user?<div className="cat-vote-buttons"><button aria-label={t('upvote')} aria-pressed={myVote===1} disabled={busy} onClick={()=>vote(1)}>↑</button><span aria-label={t('score')}>{totals.score}</span><button aria-label={t('downvote')} aria-pressed={myVote===-1} disabled={busy} onClick={()=>vote(-1)}>↓</button></div>:<div className="guest-voting"><span aria-label={t('score')}>{totals.score}</span><AuthNav user={null}/></div>}{error?<p className="error-panel" role="alert">{t(error)}</p>:null}</div>;
}
