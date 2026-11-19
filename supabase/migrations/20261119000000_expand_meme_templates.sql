-- Expand only the trusted preset list; retain upload validation and existing permissions.
begin;
create or replace function public.valid_meme_template(t jsonb) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(t)='object' and jsonb_typeof(t->'name')='string' and char_length(t->>'name') between 1 and 120
 and jsonb_typeof(t->'description')='string' and char_length(t->>'description') between 1 and 1000
 and jsonb_typeof(t->'width')='number' and jsonb_typeof(t->'height')='number'
 and (t->>'width')::numeric between 1 and 10000 and (t->>'height')::numeric between 1 and 10000
 and ((t->>'id'='188390779' and t->>'imageUrl'='https://i.imgflip.com/345v97.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/188390779/Woman-Yelling-At-Cat')
 or (t->>'id'='405658' and t->>'imageUrl'='https://imgflip.com/s/meme/Grumpy-Cat.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/Grumpy-Cat')
 or (t->>'id'='61531' and t->>'imageUrl'='https://imgflip.com/s/meme/Business-Cat.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/Business-Cat')
 or (t->>'id'='300762662' and t->>'imageUrl'='https://i.imgflip.com/4z2dye.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/300762662/Crying-cat')
 or (t->>'id'='144311615' and t->>'imageUrl'='https://i.imgflip.com/2dx3jz.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/144311615/Polite-Cat')
 or (t->>'id'='335818505' and t->>'imageUrl'='https://i.imgflip.com/5jxr7t.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/335818505/Pop-Cat')
 or (t->>'id'='211890694' and t->>'imageUrl'='https://i.imgflip.com/3i5jwm.png' and t->>'sourceUrl'='https://imgflip.com/memetemplate/211890694/Confused-loading-cat')
 or (t->>'id'='483766152' and t->>'imageUrl'='https://i.imgflip.com/800sco.png' and t->>'sourceUrl'='https://imgflip.com/memetemplate/483766152/BONGO-CAT')
 or (t->>'id'='241473660' and t->>'imageUrl'='https://i.imgflip.com/3zrm9o.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/241473660/Shocked-Cat')
 or (t->>'id'='546334101' and t->>'imageUrl'='https://i.imgflip.com/919u39.jpg' and t->>'sourceUrl'='https://imgflip.com/memetemplate/546334101/Smug-Cat')
 or (t->>'id'='uploaded' and t->>'imageUrl'='' and t->>'sourceUrl'=''
 and t->>'storagePath' ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp)$')),false);
$$;
commit;
