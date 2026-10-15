-- Session B: run while session A holds the row/unique-insert lock.
begin;
select set_config('meme_test.started',clock_timestamp()::text,true);
select public.reserve_meme_attempt();
do $$ declare latest timestamptz; finished timestamptz:=clock_timestamp(); begin
 if finished-current_setting('meme_test.started')::timestamptz<interval '1 second' then raise exception 'test did not encounter the lock; rerun sessions A/B'; end if;
 select max(t) into latest from public.meme_provider_usage,unnest(recent_attempts) t;
 if finished-latest>interval '1 second' then raise exception 'provider quota timestamp was captured before lock acquisition'; end if;
 if (select usage_date from public.meme_provider_usage)<>(latest at time zone 'America/Los_Angeles')::date then raise exception 'provider day does not match admitted request'; end if;
end $$;
rollback;
