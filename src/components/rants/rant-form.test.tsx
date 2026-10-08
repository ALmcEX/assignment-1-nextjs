import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import { RantForm } from './rant-form';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('locks editable fields while an AI response is pending so later typing cannot be discarded',async()=>{
 let finish!:(value:unknown)=>void;vi.stubGlobal('fetch',()=>new Promise(resolve=>{finish=resolve;}));
 render(<RantForm/>);fireEvent.change(screen.getByLabelText('Location'),{target:{value:'Dorm'}});
 fireEvent.click(screen.getByText(/Need a starting point/));fireEvent.change(screen.getByLabelText('Describe the moment'),{target:{value:'Laundry timer stuck'}});
 fireEvent.click(screen.getByRole('button',{name:'AI: help me write'}));
 expect(screen.getByLabelText(/Title/).matches(':disabled')).toBe(true);expect(screen.getByLabelText(/Your rant/).matches(':disabled')).toBe(true);
 finish({ok:true,json:async()=>({title:'Timer fiction',body:'AI body',generationId:'44444444-4444-4444-8444-444444444444'})});
 await waitFor(()=>expect((screen.getByLabelText(/Title/) as HTMLInputElement).value).toBe('Timer fiction'));
 expect(screen.getByLabelText(/Your rant/).matches(':disabled')).toBe(false);
});
