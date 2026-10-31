create table public.votes (
  id uuid primary key default gen_random_uuid(),
  repository_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote_type integer not null check (vote_type in (-1, 1)),
  created_at timestamp with time zone not null default now(),
  constraint votes_repository_id_user_id_key unique (repository_id, user_id)
);

alter table public.votes enable row level security;

create policy "Users can read their own votes"
  on public.votes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own votes"
  on public.votes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own votes"
  on public.votes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own votes"
  on public.votes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.votes to authenticated;

create or replace function public.get_repository_vote_score(repository_id_input text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(vote_type), 0)::integer
  from public.votes
  where repository_id = repository_id_input;
$$;

revoke all on function public.get_repository_vote_score(text) from public;
grant execute on function public.get_repository_vote_score(text) to anon, authenticated;
