create extension if not exists pgcrypto;

do $$ begin
  create type created_via as enum ('admin', 'telegram', 'bookmarklet', 'api');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type source_type as enum ('website', 'github', 'youtube', 'article', 'x', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type preview_status as enum ('none', 'pending', 'ready', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type tool_status as enum ('inbox', 'reviewed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type moderation_state as enum ('inbox', 'relevant', 'archived', 'discarded');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type pricing_type as enum ('free', 'freemium', 'paid', 'unknown');
exception
  when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'owner'
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  "createdAt" timestamptz not null default now()
);

create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  url text not null unique,
  "originalUrl" text not null,
  "createdVia" created_via not null default 'api',
  "sourceType" source_type not null default 'website',
  title text,
  description text,
  "faviconUrl" text,
  "ogImageUrl" text,
  "screenshotUrl" text,
  "previewStatus" preview_status not null default 'none',
  pricing pricing_type not null default 'unknown',
  oss boolean not null default false,
  "categoryId" uuid references categories(id) on delete set null,
  status tool_status not null default 'inbox',
  relevant boolean,
  "moderationState" moderation_state not null default 'inbox',
  "moderationPosition" int not null default 0,
  "notesPrivate" text,
  "notesPublic" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "reviewedAt" timestamptz,
  "lastSeenAt" timestamptz,
  "seenCount" int not null default 1
);

create table if not exists tool_tags (
  "toolId" uuid not null references tools(id) on delete cascade,
  "tagId" uuid not null references tags(id) on delete cascade,
  primary key ("toolId", "tagId")
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  "isPublic" boolean not null default true,
  position int not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists collection_tools (
  "collectionId" uuid not null references collections(id) on delete cascade,
  "toolId" uuid not null references tools(id) on delete cascade,
  position int not null default 0,
  primary key ("collectionId", "toolId")
);

create index if not exists idx_tools_status_relevant on tools(status, relevant);
create index if not exists idx_tools_moderation_order on tools("moderationState", "moderationPosition", "createdAt");
create index if not exists idx_tools_reviewed_at on tools("reviewedAt");
create index if not exists idx_tools_created_at on tools("createdAt");
create unique index if not exists idx_tools_slug_unique on tools(slug);
