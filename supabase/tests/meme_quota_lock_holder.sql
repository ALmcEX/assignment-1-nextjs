-- Run as postgres in session A, then immediately run meme_quota_lock_wait.sql
-- in session B. Both sessions roll back. Intended for isolated/staging testing.
begin;
insert into public.meme_provider_usage(singleton,usage_date) values(true,(now() at time zone 'America/Los_Angeles')::date) on conflict do nothing;
select singleton from public.meme_provider_usage where singleton for update;
select pg_sleep(15);
rollback;
