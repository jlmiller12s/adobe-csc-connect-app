-- schema.sql
-- Run this in your Supabase SQL Editor

-- 1. Profiles (matches auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  role text,
  team text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger for updated_at
create extension if not exists moddatetime schema extensions;
create trigger handle_updated_at before update on profiles
  for each row execute procedure moddatetime (updated_at);

-- Trigger to create profile upon auth signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Photos
create table public.photos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  image_url text not null,
  caption text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.photos enable row level security;
create policy "Photos are viewable by everyone." on public.photos for select using (true);
create policy "Users can insert their own photos." on public.photos for insert with check (auth.uid() = user_id);
create policy "Users can update own photos." on public.photos for update using (auth.uid() = user_id);
create policy "Users can delete own photos." on public.photos for delete using (auth.uid() = user_id);

-- 3. Channels
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.channels enable row level security;
create policy "Channels are viewable by everyone." on public.channels for select using (true);

-- 4. Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.messages enable row level security;
create policy "Messages are viewable by everyone." on public.messages for select using (true);
create policy "Users can insert their own messages." on public.messages for insert with check (auth.uid() = user_id);

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;

-- 5. Notes
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  session_title text,
  speaker text,
  content text,
  tags text[],
  is_shared boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notes enable row level security;
create policy "Shared notes are viewable by everyone." on public.notes for select using (is_shared = true or auth.uid() = user_id);
create policy "Users can insert their own notes." on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes." on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes." on public.notes for delete using (auth.uid() = user_id);

-- 6. Sessions (Schedule)
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sessions enable row level security;
create policy "Sessions are viewable by everyone." on public.sessions for select using (true);

-- 7. Announcements
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  is_pinned boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.announcements enable row level security;
create policy "Announcements are viewable by everyone." on public.announcements for select using (true);

-- 8. Storage Policies
-- Supabase Storage requires its own policies beyond just setting a bucket to "Public"
-- This allows anyone who is logged in to upload files to the "photos" bucket
create policy "Allow authenticated uploads" on storage.objects for insert to authenticated with check ( bucket_id = 'photos' );
create policy "Allow authenticated updates" on storage.objects for update to authenticated using ( bucket_id = 'photos' );
