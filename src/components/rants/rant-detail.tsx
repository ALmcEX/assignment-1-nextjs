'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { RantDetail as Detail } from '@/src/lib/rants/types';
import { useLanguage } from '../language-provider';
import { RantInteractions } from './rant-interactions';
export function RantDetail({rant,user}:{rant:Detail;user:User|null}){const {t,language}=useLanguage();return <main className="detail-shell"><Link className="back-link" href="/">← {t('back')}</Link><article className="rant-article"><div className="detail-meta"><span>⌖ {rant.location}</span><time dateTime={rant.created_at}>{new Date(rant.created_at).toLocaleDateString(language==='en'?'en-US':'zh-CN',{month:'short',day:'numeric',year:'numeric',timeZone:'America/New_York'})}</time></div><h1>{rant.title}</h1>{rant.generation_id?<span className="ai-badge">✦ {t(rant.is_example?'aiExample':rant.ai_image_path?'aiCatGenerated':'aiGenerated')}</span>:null}<p className="rant-body">{rant.body}</p>{rant.aiImageUrl?<figure className="ai-cat-figure"><Image src={rant.aiImageUrl} alt={t('aiPreview')} width={1024} height={1024} unoptimized/><figcaption>✦ {t('aiCatGenerated')}</figcaption></figure>:null}{rant.imageUrl?<div className="rant-photo"><Image src={rant.imageUrl} alt={rant.title} width={1000} height={750} unoptimized/></div>:null}</article><RantInteractions rantId={rant.id} user={user} myVote={rant.myVote} totals={rant.totals} comments={rant.comments} commentsCount={rant.commentsCount} commentsPage={rant.commentsPage} hasOlderComments={rant.hasOlderComments}/></main>;}
