alter table public.ratings enable row level security;
alter table public.favorites enable row level security;

alter table public.ratings
alter column user_id set not null,
alter column movie_id set not null,
alter column rating set not null;

alter table public.favorites
alter column user_id set not null,
alter column movie_id set not null;

alter table public.ratings
drop constraint if exists ratings_user_id_movie_id_key;

alter table public.ratings
add constraint ratings_user_id_movie_id_key unique (user_id, movie_id);

alter table public.favorites
drop constraint if exists favorites_user_id_movie_id_key;

alter table public.favorites
add constraint favorites_user_id_movie_id_key unique (user_id, movie_id);

alter table public.ratings
drop constraint if exists ratings_rating_check;

alter table public.ratings
add constraint ratings_rating_check check (rating between 0 and 5);

drop policy if exists "ratings_select_all_authenticated" on public.ratings;
drop policy if exists "ratings_select_own" on public.ratings;
drop policy if exists "ratings_insert_own" on public.ratings;
drop policy if exists "ratings_update_own" on public.ratings;
drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

create policy "ratings_select_own"
on public.ratings for select
to authenticated
using (auth.uid() = user_id);

create policy "ratings_insert_own"
on public.ratings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "ratings_update_own"
on public.ratings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "favorites_select_own"
on public.favorites for select
to authenticated
using (auth.uid() = user_id);

create policy "favorites_insert_own"
on public.favorites for insert
to authenticated
with check (auth.uid() = user_id);

create policy "favorites_delete_own"
on public.favorites for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists ratings_user_id_idx on public.ratings(user_id);
create index if not exists ratings_movie_id_idx on public.ratings(movie_id);
create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_movie_id_idx on public.favorites(movie_id);
