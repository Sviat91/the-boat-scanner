# Tasks

  create table if not exists public.favorites (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    url text not null,
    title text,
    description text,
    thumbnail text,
    source_json jsonb,
    created_at timestamptz default now(),
    unique (user_id, url)
  );
