-- 1. Watch Later (My List) Table
create table if not exists public.watch_later (
  user_id uuid references auth.users not null,
  video_id uuid references public.videos not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, video_id)
);

alter table public.watch_later enable row level security;

create policy "Users can view their own watch later"
  on public.watch_later for select
  using ( auth.uid() = user_id );

create policy "Users can add to watch later"
  on public.watch_later for insert
  with check ( auth.uid() = user_id );

create policy "Users can remove from watch later"
  on public.watch_later for delete
  using ( auth.uid() = user_id );

-- 2. Watch History Table
create table if not exists public.watch_history (
  user_id uuid references auth.users not null,
  video_id uuid references public.videos not null,
  last_watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, video_id)
);

alter table public.watch_history enable row level security;

create policy "Users can view their own history"
  on public.watch_history for select
  using ( auth.uid() = user_id );

create policy "Users can update their history"
  on public.watch_history for insert
  with check ( auth.uid() = user_id )
  on conflict (user_id, video_id) do update set last_watched_at = now();

-- 3. Delete Account Function (Security Critical)
create or replace function delete_my_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
