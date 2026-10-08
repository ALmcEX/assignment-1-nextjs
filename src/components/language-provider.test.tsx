import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from './language-provider';
import { PhotoPicker } from './photo-picker';
afterEach(() => { cleanup(); localStorage.clear(); });
function Probe() { const {setLanguage,t}=useLanguage(); return <><button onClick={()=>setLanguage('zh-CN')}>中文</button><p>{t('publish')}</p><PhotoPicker name="photo" /></>; }
it('switches labels and file selection controls, and remembers the choice',()=>{
 render(<LanguageProvider><Probe/></LanguageProvider>);
 expect(screen.getByText('Publish rant')).toBeTruthy();
 fireEvent.click(screen.getByText('中文'));
 expect(screen.getByText('发布吐槽')).toBeTruthy();
 expect(screen.getByRole('button',{name:'选择照片'})).toBeTruthy();
 cleanup(); render(<LanguageProvider><Probe/></LanguageProvider>);
 expect(screen.getByText('发布吐槽')).toBeTruthy();
});
