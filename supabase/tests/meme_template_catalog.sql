-- No provider calls; all generated records and publications roll back.
begin;
do $$
declare u uuid:=gen_random_uuid(); t jsonb; g uuid; p uuid; n integer:=0;
begin
 insert into auth.users(id) values(u);
 perform set_config('request.jwt.claim.sub',u::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 for t in select jsonb_build_object('id',id,'name',name,'description',name,'imageUrl',image_url,'sourceUrl',source_url,'width',width,'height',height)
 from (values
('61531','Business Cat','https://imgflip.com/s/meme/Business-Cat.jpg','https://imgflip.com/memetemplate/Business-Cat',500,500),
('300762662','Crying Cat','https://i.imgflip.com/4z2dye.jpg','https://imgflip.com/memetemplate/300762662/Crying-cat',720,633),
('144311615','Polite Cat','https://i.imgflip.com/2dx3jz.jpg','https://imgflip.com/memetemplate/144311615/Polite-Cat',800,450),
('335818505','Pop Cat','https://i.imgflip.com/5jxr7t.jpg','https://imgflip.com/memetemplate/335818505/Pop-Cat',300,168),
('211890694','Confused Loading Cat','https://i.imgflip.com/3i5jwm.png','https://imgflip.com/memetemplate/211890694/Confused-loading-cat',635,521),
('483766152','Bongo Cat','https://i.imgflip.com/800sco.png','https://imgflip.com/memetemplate/483766152/BONGO-CAT',723,422),
('241473660','Shocked Cat','https://i.imgflip.com/3zrm9o.jpg','https://imgflip.com/memetemplate/241473660/Shocked-Cat',1495,1388),
('546334101','Smug Cat','https://i.imgflip.com/919u39.jpg','https://imgflip.com/memetemplate/546334101/Smug-Cat',1920,1920)
 ) as presets(id,name,image_url,source_url,width,height)
 loop
  if not public.valid_meme_template(t) then raise exception 'preset rejected: %',t->>'name'; end if;
  if public.valid_meme_template(t || '{"imageUrl":"https://evil.example/cat.jpg"}'::jsonb) then raise exception 'forged URL accepted'; end if;
  g:=public.finish_caption_choices(u,public.reserve_ai_generation(u),'Template integration check','Fixture, no provider request','en','gemini-3.1-flash-lite',array['First option','Second option','Third option','Fourth option'],t);
  p:=public.publish_caption_choice(g,1,'');
  if not exists(select 1 from public.rants where id=p and user_id=u and body='Second option' and meme_template=t) then raise exception 'publication snapshot mismatch'; end if;
  n:=n+1;
 end loop;
 if n<>8 then raise exception 'expected 8 additions'; end if;
end $$;
rollback;
select 'PASS: 8 presets saved and published; forged URLs rejected; fixtures rolled back' as verification;
