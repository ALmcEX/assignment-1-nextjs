import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {RantForm} from './rant-form';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('preserves authored text, previews a generated cat and lets the user remove it',async()=>{
 let finish!:(value:unknown)=>void;vi.stubGlobal('fetch',()=>new Promise(resolve=>{finish=resolve;}));
 render(<RantForm imageEnabled/>);fireEvent.change(screen.getByLabelText(/Title/),{target:{value:'My title'}});fireEvent.change(screen.getByLabelText(/Your rant/),{target:{value:'My own story'}});fireEvent.change(screen.getByLabelText('Location'),{target:{value:'Dorm'}});
 fireEvent.click(screen.getByText(/Create a cat image/));fireEvent.change(screen.getByLabelText('Describe your cat scene'),{target:{value:'A sleepy cat watching laundry'}});fireEvent.change(screen.getByLabelText('Cat type'),{target:{value:'ragdoll'}});
 fireEvent.click(screen.getByRole('button',{name:'Generate cat image'}));expect(screen.getByLabelText(/Title/).matches(':disabled')).toBe(true);
 finish({ok:true,json:async()=>({imageUrl:'https://storage.example/cat.png',generationId:'44444444-4444-4444-8444-444444444444'})});
 await screen.findByRole('img',{name:'Your AI-generated cat'});expect((screen.getByLabelText(/Title/) as HTMLInputElement).value).toBe('My title');expect((screen.getByLabelText(/Your rant/) as HTMLTextAreaElement).value).toBe('My own story');expect(screen.getByLabelText(/Your rant/).matches(':disabled')).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Remove cat image'}));await waitFor(()=>expect(screen.queryByRole('img',{name:'Your AI-generated cat'})).toBeNull());
});
it('keeps the previous image and story when a replacement fails',async()=>{
 let n=0;vi.stubGlobal('fetch',async()=>++n===1?{ok:true,json:async()=>({imageUrl:'https://storage.example/cat.png',generationId:'44444444-4444-4444-8444-444444444444'})}:{ok:false,json:async()=>({error:'aiUnavailable'})});
 render(<RantForm imageEnabled/>);fireEvent.change(screen.getByLabelText('Location'),{target:{value:'Dorm'}});fireEvent.click(screen.getByText(/Create a cat image/));fireEvent.change(screen.getByLabelText('Describe your cat scene'),{target:{value:'A cat with yarn'}});fireEvent.click(screen.getByRole('button',{name:'Generate cat image'}));await screen.findByRole('img',{name:'Your AI-generated cat'});fireEvent.click(screen.getByRole('button',{name:'Generate cat image'}));await screen.findByRole('alert');expect(screen.getByRole('img',{name:'Your AI-generated cat'}).getAttribute('src')).toBe('https://storage.example/cat.png');
});
it('clearly labels the disabled feature and prevents generation before billing activation',()=>{
 render(<RantForm imageEnabled={false}/>);fireEvent.click(screen.getByText(/Create a cat image/));fireEvent.change(screen.getByLabelText('Location'),{target:{value:'Dorm'}});fireEvent.change(screen.getByLabelText('Describe your cat scene'),{target:{value:'A sleepy cat'}});
 expect(screen.getByRole('button',{name:'Generate cat image'}).matches(':disabled')).toBe(true);expect(screen.getByText(/Cat image generation is not enabled yet/)).toBeTruthy();
});
