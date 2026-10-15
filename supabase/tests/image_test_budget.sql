-- Test fixtures and usage changes are rolled back.
begin;
do $$ begin
 if has_function_privilege('anon','public.reserve_image_test_attempt()','execute') or has_function_privilege('authenticated','public.reserve_image_test_attempt()','execute') then raise exception 'client can spend image budget'; end if;
end $$;
set local role service_role;
do $$ declare i int; begin
 for i in 1..10 loop perform public.reserve_image_test_attempt(); end loop;
 begin perform public.reserve_image_test_attempt(); raise exception 'eleventh paid attempt admitted'; exception when others then if sqlerrm not like '%quotaExceeded%' then raise; end if; end;
 if (select attempts from public.image_test_budget where singleton)<>10 then raise exception 'attempts not durable'; end if;
end $$;
reset role;
rollback;
