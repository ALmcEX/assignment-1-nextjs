import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import type {User} from '@supabase/supabase-js';
import {MyCats} from './my-cats';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));afterEach(cleanup);
it('provides an honest empty gallery and a way to create',()=>{render(<MyCats items={[]} user={{id:'owner'} as User} page={1} hasMore={false} hasError={false}/>);expect(screen.getByText('Your gallery starts with one idea.')).toBeTruthy();expect(screen.getByRole('link',{name:/Create a cat/}).getAttribute('href')).toBe('/create');});
it('shows query errors instead of claiming there are no works',()=>{render(<MyCats items={[]} user={{id:'owner'} as User} page={1} hasMore={false} hasError/>);expect(screen.getByRole('alert')).toBeTruthy();expect(screen.queryByText('Your gallery starts with one idea.')).toBeNull();});
