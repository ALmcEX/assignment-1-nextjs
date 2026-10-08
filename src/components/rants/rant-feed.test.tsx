import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RantFeed } from './rant-feed';
afterEach(cleanup);
it('links title and location without leaking detail content into the homepage',()=>{
 const rows=[{id:'abc',title:'Laundry lies',location:'Dorm',body:'Secret body',comments:[{body:'Secret comment'}],image_path:'secret.jpg'}];
 render(<RantFeed rants={rows} sort="latest" hasError={false}/>);
 expect(screen.getByRole('link',{name:/Laundry lies/}).getAttribute('href')).toBe('/rants/abc');
 expect(screen.getByText('Dorm')).toBeTruthy();
 expect(screen.queryByText('Secret body')).toBeNull();expect(screen.queryByText('Secret comment')).toBeNull();expect(screen.queryByRole('img')).toBeNull();
});
