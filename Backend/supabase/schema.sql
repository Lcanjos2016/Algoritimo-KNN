create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.movies (
  id bigint generated always as identity primary key,
  title text not null,
  genre text not null,
  year integer not null,
  description text not null,
  image text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  rating integer not null check (rating between 0 and 5),
  rated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create or replace function public.check_favorite_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.favorites
    where user_id = new.user_id
  ) >= 5 then
    raise exception 'Cada usuario pode adicionar no maximo 5 filmes favoritos.';
  end if;

  return new;
end;
$$;

drop trigger if exists favorites_limit_trigger on public.favorites;

create trigger favorites_limit_trigger
before insert on public.favorites
for each row
execute function public.check_favorite_limit();

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.ratings enable row level security;
alter table public.favorites enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

create policy "movies_select_all"
on public.movies for select
to authenticated
using (true);

create policy "ratings_select_all_authenticated"
on public.ratings for select
to authenticated
using (true);

create policy "ratings_insert_own"
on public.ratings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "ratings_update_own"
on public.ratings for update
to authenticated
using (auth.uid() = user_id);

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

insert into public.movies (title, genre, year, description, image)
values
  ('Interestelar', 'sci-fi, drama, adventure', 2014, 'Uma equipe cruza o espaço em busca de um novo lar para a humanidade.', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),
  ('A Origem', 'sci-fi, action, thriller', 2010, 'Um ladrão invade sonhos para roubar segredos e recebe uma missão impossível.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'),
  ('Clube da Luta', 'drama, thriller', 1999, 'Um homem insatisfeito encontra uma forma perigosa de extravasar sua vida vazia.', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg'),
  ('O Poderoso Chefao', 'crime, drama', 1972, 'A saga de uma família mafiosa entre poder, lealdade e violência.', 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'),
  ('Matrix', 'sci-fi, action', 1999, 'Um programador descobre que a realidade é uma simulação controlada.', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'),
  ('Parasita', 'drama, thriller, comedy', 2019, 'Duas famílias de classes sociais opostas entram em uma relação instável.', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),
  ('Mad Max: Estrada da Furia', 'action, adventure', 2015, 'Furiosa e Max atravessam o deserto fugindo de um tirano.', 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg'),
  ('La La Land', 'romance, drama, music', 2016, 'Uma atriz e um músico tentam equilibrar amor e ambição em Los Angeles.', 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg'),
  ('Whiplash', 'drama, music', 2014, 'Um baterista promissor enfrenta um professor obsessivo e abusivo.', 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg'),
  ('Toy Story', 'animation, adventure, comedy', 1995, 'Brinquedos ganham vida quando os humanos nao estão olhando.', 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg')
on conflict do nothing;
