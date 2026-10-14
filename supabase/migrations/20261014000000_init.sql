-- SchoolSwap schema: profiles, listings, conversations, messages, articles, photo storage.
-- Every table has row level security; access rules live here, not in the frontend.

------------------------------------------------------------------------------
-- Profiles (one per auth user)
------------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null check (char_length(name) between 2 and 60),
  role       text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Signed-in users can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Users may change their name, never their role.
revoke update on public.profiles from authenticated, anon;
grant update (name) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

------------------------------------------------------------------------------
-- Listings
------------------------------------------------------------------------------
create table public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null default auth.uid() references public.profiles on delete cascade,
  title       text not null check (char_length(title) between 3 and 70),
  description text not null check (char_length(description) between 10 and 2000),
  price       integer not null check (price between 0 and 100000),
  category    text not null check (category in ('Textbooks', 'School supplies', 'Electronics', 'Clothing', 'Other')),
  condition   text not null check (condition in ('New', 'Like new', 'Good', 'Fair')),
  photos      text[] not null check (cardinality(photos) between 1 and 5),
  status      text not null default 'active' check (status in ('active', 'sold')),
  created_at  timestamptz not null default now()
);

create index listings_created_at_idx on public.listings (created_at desc);
create index listings_seller_idx on public.listings (seller_id);

alter table public.listings enable row level security;

-- Visitors see listings on the landing page; seller names stay behind login (profiles).
create policy "Anyone can read listings"
  on public.listings for select to anon, authenticated using (true);

create policy "Users create their own listings"
  on public.listings for insert to authenticated with check (seller_id = auth.uid());

create policy "Sellers update their own listings"
  on public.listings for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy "Sellers delete their own listings"
  on public.listings for delete to authenticated using (seller_id = auth.uid());

------------------------------------------------------------------------------
-- Conversations: one per (listing, buyer). Only the two participants can see it.
------------------------------------------------------------------------------
create table public.conversations (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid references public.listings on delete set null,
  listing_title       text not null,
  buyer_id            uuid not null references public.profiles on delete cascade,
  seller_id           uuid not null references public.profiles on delete cascade,
  last_message_text   text,
  last_message_sender uuid,
  last_message_at     timestamptz,
  buyer_read_at       timestamptz not null default now(),
  seller_read_at      timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create index conversations_buyer_idx on public.conversations (buyer_id);
create index conversations_seller_idx on public.conversations (seller_id);

alter table public.conversations enable row level security;

create policy "Participants read their conversations"
  on public.conversations for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));

-- Conversations are created only through start_conversation(), which checks the listing.
revoke insert, update, delete on public.conversations from authenticated, anon;

create function public.start_conversation(p_listing_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_listing public.listings;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if not found then
    raise exception 'Listing not found';
  end if;
  if v_listing.seller_id = auth.uid() then
    raise exception 'You cannot message yourself';
  end if;

  insert into public.conversations (listing_id, listing_title, buyer_id, seller_id)
  values (v_listing.id, v_listing.title, auth.uid(), v_listing.seller_id)
  on conflict (listing_id, buyer_id) do update set listing_title = excluded.listing_title
  returning id into v_id;

  return v_id;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.conversations set
    buyer_read_at  = case when buyer_id  = auth.uid() then now() else buyer_read_at  end,
    seller_read_at = case when seller_id = auth.uid() then now() else seller_read_at end
  where id = p_conversation_id and auth.uid() in (buyer_id, seller_id);
$$;

------------------------------------------------------------------------------
-- Messages
------------------------------------------------------------------------------
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id       uuid not null default auth.uid() references public.profiles on delete cascade,
  body            text not null check (char_length(trim(body)) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create function public.is_participant(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations
    where id = p_conversation_id and auth.uid() in (buyer_id, seller_id)
  );
$$;

create policy "Participants read messages"
  on public.messages for select to authenticated
  using (public.is_participant(conversation_id));

create policy "Participants send messages as themselves"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_participant(conversation_id));

-- Keep the inbox preview and the sender's read marker up to date.
create function public.on_message_sent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set
    last_message_text   = left(new.body, 140),
    last_message_sender = new.sender_id,
    last_message_at     = new.created_at,
    buyer_read_at       = case when buyer_id  = new.sender_id then new.created_at else buyer_read_at  end,
    seller_read_at      = case when seller_id = new.sender_id then new.created_at else seller_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_sent
  after insert on public.messages
  for each row execute function public.on_message_sent();

------------------------------------------------------------------------------
-- School News articles: everyone reads, only admins write.
------------------------------------------------------------------------------
create table public.articles (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid default auth.uid() references public.profiles on delete set null,
  author_name  text not null default 'School Office',
  section      text not null check (section in ('Notices', 'Events', 'Announcements', 'Achievements')),
  title        text not null check (char_length(title) between 3 and 140),
  summary      text not null default '',
  body         text not null default '',
  photo_url    text,
  is_notice    boolean not null default false,
  is_demo      boolean not null default false,
  published_at timestamptz not null default now()
);

create index articles_published_idx on public.articles (published_at desc);

alter table public.articles enable row level security;

create policy "Anyone can read articles"
  on public.articles for select to anon, authenticated using (true);

create policy "Admins insert articles"
  on public.articles for insert to authenticated with check (public.is_admin());

create policy "Admins update articles"
  on public.articles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete articles"
  on public.articles for delete to authenticated using (public.is_admin());

------------------------------------------------------------------------------
-- Photo storage: public read, users write only inside their own folder (<user id>/...).
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Users upload photos to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

------------------------------------------------------------------------------
-- Realtime: push row changes to open browsers. RLS still decides who receives what.
------------------------------------------------------------------------------
alter publication supabase_realtime add table public.listings, public.articles, public.conversations, public.messages;
