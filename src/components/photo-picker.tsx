'use client';
import { useId, useRef, useState } from 'react';
import { useLanguage } from './language-provider';
export function PhotoPicker({name, label='optionalPhoto', accept='image/jpeg,image/png,image/webp', onChange}:{name:string;label?:string;accept?:string;onChange?:(file:File|null)=>void}) {
 const {t}=useLanguage(); const id=useId(); const input=useRef<HTMLInputElement>(null); const [filename,setFilename]=useState('');
 return <div className="photo-field"><label htmlFor={id}>{t(label)}</label><input ref={input} id={id} className="sr-only" name={name} type="file" accept={accept} onChange={e=>{const file=e.target.files?.[0]??null;setFilename(file?.name??'');onChange?.(file);}}/><div className="photo-controls"><button type="button" className="secondary" onClick={()=>input.current?.click()}>{t('choosePhoto')}</button><span>{filename||t('noPhoto')}</span>{filename?<button className="text-button" type="button" onClick={()=>{if(input.current)input.current.value='';setFilename('');onChange?.(null);}}>{t('removePhoto')}</button>:null}</div><small>{t('photoHint')}</small></div>;
}
