-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create history table
create table public.history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  url text not null,
  title text,
  visited_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for history
alter table public.history enable row level security;

create policy "Users can view own history."
  on history for select
  using ( auth.uid() = user_id );

create policy "Users can insert own history."
  on history for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own history."
  on history for delete
  using ( auth.uid() = user_id );

-- Create bookmarks table
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  url text not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for bookmarks
alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks."
  on bookmarks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own bookmarks."
  on bookmarks for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own bookmarks."
  on bookmarks for delete
  using ( auth.uid() = user_id );

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
