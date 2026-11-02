-- Lets a signed-in user remove their own vote (clicking the same arrow twice).
-- Shares the 10-mutations-per-minute limit with submit_repository_vote.

create or replace function public.remove_repository_vote(repository_id_input text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  voter_id uuid := auth.uid();
  window_started timestamp with time zone;
  current_mutation_count integer;
begin
  if voter_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if repository_id_input is null
    or char_length(repository_id_input) > 201
    or repository_id_input !~ '^[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*$'
  then
    raise exception using errcode = '22023', message = 'invalid_vote';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(voter_id::text, 0)
  );

  select rate_limit.window_started_at, rate_limit.mutation_count
    into window_started, current_mutation_count
    from compass_private.vote_rate_limits as rate_limit
    where rate_limit.user_id = voter_id
    for update;

  if not found or window_started <= now() - interval '1 minute' then
    insert into compass_private.vote_rate_limits (user_id, window_started_at, mutation_count)
    values (voter_id, now(), 1)
    on conflict (user_id) do update
      set window_started_at = excluded.window_started_at,
          mutation_count = excluded.mutation_count;
  else
    if current_mutation_count >= 10 then
      raise exception using errcode = 'P0001', message = 'vote_rate_limited';
    end if;

    update compass_private.vote_rate_limits
      set mutation_count = current_mutation_count + 1
      where user_id = voter_id;
  end if;

  delete from public.votes
  where repository_id = repository_id_input and user_id = voter_id;

  return (
    select coalesce(sum(vote.vote_type), 0)::integer
    from public.votes as vote
    where vote.repository_id = repository_id_input
  );
end;
$$;

revoke all on function public.remove_repository_vote(text) from public;
grant execute on function public.remove_repository_vote(text) to authenticated;
