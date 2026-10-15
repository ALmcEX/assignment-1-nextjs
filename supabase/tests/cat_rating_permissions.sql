-- Execute after migrations in a disposable database or the SQL editor. All fixtures roll back.
begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
insert into storage.objects(bucket_id,name) values('ai-cat-images','11111111-1111-4111-8111-111111111111/test.png');
insert into public.ai_generations(id,user_id,prompt,system_prompt,title,body,language,provider,media_type,image_path,mime_type,cat_breed,art_style)
values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','A cat in space','test','Cat','Cat','en','test','image','11111111-1111-4111-8111-111111111111/test.png','image/png','orange','clay');
insert into public.ai_generations(id,user_id,prompt,system_prompt,title,body,language,provider)
values('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','text','test','Text','Text','en','test');
set local role anon;
select set_config('request.jwt.claim.role','anon',true);
do $$ declare denied boolean:=false; begin
 begin perform public.publish_cat_image('33333333-3333-4333-8333-333333333333','',''); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'anonymous publication allowed'; end if;
 if exists(select 1 from public.cat_feed_page('latest','all',0,true)) then raise exception 'anonymous mine not empty'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claim.role','authenticated',true);
do $$ declare denied boolean:=false; begin
 begin perform public.publish_cat_image('33333333-3333-4333-8333-333333333333','',''); exception when others then denied:=true; end;
 if not denied then raise exception 'other user published generation'; end if;
 if exists(select 1 from public.ai_generations where id='33333333-3333-4333-8333-333333333333') then raise exception 'private prompt leaked'; end if;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.publish_cat_image('33333333-3333-4333-8333-333333333333','','');
do $$ declare denied boolean:=false; row record; begin
 begin perform public.publish_cat_image('44444444-4444-4444-8444-444444444444','',''); exception when others then denied:=true; end;
 if not denied then raise exception 'text generation became cat image'; end if;
 select * into row from public.cat_feed_page('latest','all',0,true);
 if row.title<>'A cat in space' or row.location<>'' or row.body<>'A cat in space' or row."canReuse"<>true then raise exception 'publication metadata incorrect'; end if;
 perform public.toggle_rant_vote(row.id,1::smallint);
 select * into row from public.cat_feed_page('popular','all',0,true);
 if row.totals->>'score'<>'1' or row."myVote"<>1 then raise exception 'vote aggregate incorrect'; end if;
 perform public.toggle_rant_vote(row.id,-1::smallint);
 select * into row from public.cat_feed_page('popular','all',0,true);
 if row.totals->>'score'<>'-1' then raise exception 'vote switch incorrect'; end if;
 perform public.toggle_rant_vote(row.id,-1::smallint);
end $$;
reset role;
-- Future works and historical text must not enter the gallery.
select set_config('request.jwt.claim.role','service_role',true);
insert into public.rants(title,location,body,is_example) values('Old text','Dorm','Legacy',true);
update public.rants set created_at=now()+interval '1 day' where generation_id='33333333-3333-4333-8333-333333333333';
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','anon',true);
do $$ declare denied boolean:=false; begin
 if exists(select 1 from public.cat_feed_page('latest','all',0,false)) then raise exception 'future or text leaked'; end if;
 begin perform public.cat_feed_page('popular','bad',0,false); exception when others then denied:=true; end;
 if not denied then raise exception 'invalid window accepted'; end if;
 if (date_trunc('month',timestamp '2026-11-15 12:00:00') at time zone 'America/New_York')<>timestamptz '2026-11-01 04:00:00Z' then raise exception 'DST month boundary incorrect'; end if;
 if (date_trunc('week',timestamp '2026-10-14 12:00:00') at time zone 'America/New_York')<>timestamptz '2026-10-12 04:00:00Z' then raise exception 'week boundary incorrect'; end if;
end $$;
rollback;
