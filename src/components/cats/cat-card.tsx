'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useState} from 'react';
import type {User} from '@supabase/supabase-js';
import type {CatFeedItem} from '@/src/lib/cats/types';
import {useLanguage} from '../language-provider';
import {CatVoteControls} from './cat-vote-controls';
export const breedKey={orange:'catOrange',tabby:'catTabby',ragdoll:'catRagdoll',british:'catBritish',tuxedo:'catTuxedo',calico:'catCalico'};
export const styleKey={photo:'stylePhoto',illustration:'styleIllustration',clay:'styleClay'};
export function CatCard({item,user}:{item:CatFeedItem;user:User|null}){
 const {t}=useLanguage();const [failedUrl,setFailedUrl]=useState<string|null>(null);
 return <article className="cat-card"><Link href={`/rants/${item.id}`} className="cat-card-art" aria-label={`${t('viewCreation')}: ${item.title}`}>{item.imageUrl&&!item.imageError&&failedUrl!==item.imageUrl?<Image src={item.imageUrl} width={1024} height={1024} unoptimized alt={item.title} onError={()=>setFailedUrl(item.imageUrl)}/>:<span className="image-error">{t('imageMissing')}</span>}<span className="art-badge">✦ {t('aiCatGenerated')}</span></Link><div className="cat-card-content"><div className="cat-tags"><span>{t(breedKey[item.breed])}</span><span>{t(styleKey[item.style])}</span></div><Link href={`/rants/${item.id}`}><h2>{item.title}</h2></Link><p className="cat-caption">{item.body}</p><div className="cat-card-bottom"><CatVoteControls id={item.id} user={user} totals={item.totals} myVote={item.myVote}/>{item.canReuse?<Link className="reuse-small" href={`/create?reuse=${item.id}`}>{t('reusePrompt')} ↗</Link>:<Link className="detail-arrow" aria-label={`${t('viewCreation')}: ${item.title}`} href={`/rants/${item.id}`}>↗</Link>}</div></div></article>;
}
