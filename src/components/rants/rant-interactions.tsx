'use client';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { RantComment,VoteTotals } from '@/src/lib/rants/types';
import { setVote,addComment } from '@/src/lib/rants/mutations';
import { createBrowserSupabaseClient } from '@/src/lib/supabase/browser';
import { errorKey } from '@/src/lib/i18n';
import { useLanguage } from '../language-provider';
import { AuthNav } from '../auth-nav';
export type InteractionProps={rantId:string;user:User|null;myVote:1|-1|null;totals:VoteTotals;comments:RantComment[]};
export function RantInteractions({rantId,user,myVote,totals,comments}:InteractionProps){
 const {t,language}=useLanguage();const router=useRouter();const [busy,setBusy]=useState<'vote'|'comment'|null>(null);const [error,setError]=useState<string|null>(null);const [body,setBody]=useState('');
 async function vote(value:1|-1){if(busy)return;setBusy('vote');setError(null);try{await setVote(createBrowserSupabaseClient(),rantId,value);router.refresh();}catch(e){setError(errorKey(e));}finally{setBusy(null);}}
 async function comment(event:FormEvent){event.preventDefault();if(busy)return;setBusy('comment');setError(null);try{await addComment(createBrowserSupabaseClient(),rantId,body);setBody('');router.refresh();}catch(e){setError(errorKey(e));}finally{setBusy(null);}}
 return <><section className="vote-section">{user?<><div className="vote-controls"><button type="button" disabled={!!busy} aria-pressed={myVote===1} onClick={()=>vote(1)}>↑ {t('upvote')} <span>{totals.upvotes}</span></button><button type="button" disabled={!!busy} aria-pressed={myVote===-1} onClick={()=>vote(-1)}>↓ {t('downvote')} <span>{totals.downvotes}</span></button></div><small>{t('voteHint')}</small></>:<div className="login-callout"><p>{t('loginInteract')}</p><AuthNav user={null}/></div>}</section>{error?<p className="error-panel" role="alert">{t(error)}</p>:null}<section className="conversation"><div className="section-title"><h2>{t('comments')}</h2><span>{comments.length}</span></div>{user?<form className="comment-form" onSubmit={comment}><label className="sr-only" htmlFor="comment-body">{t('comment')}</label><textarea id="comment-body" value={body} onChange={e=>setBody(e.target.value)} maxLength={1000} rows={3} required placeholder={t('commentPlaceholder')}/><button disabled={!!busy||!body.trim()} type="submit">{t(busy==='comment'?'commenting':'comment')}</button></form>:null}{comments.length?<ul className="comment-list">{comments.map(item=><li key={item.id}><div><strong>{t('author')}</strong><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(language==='en'?'en-US':'zh-CN',{month:'short',day:'numeric',timeZone:'America/New_York'})}</time></div><p>{item.body}</p></li>)}</ul>:<p className="muted">{t('noComments')}</p>}</section></>;
}
