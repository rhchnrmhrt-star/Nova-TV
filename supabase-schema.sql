-- Nova TV cloud database schema
create extension if not exists pgcrypto;

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  category text not null default 'عام',
  stream_url text not null,
  logo_url text,
  background_url text,
  accent text default '#1677ff',
  description text default '',
  enabled boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activation_codes (
  code text primary key,
  enabled boolean not null default true,
  expires_at date,
  max_devices integer not null default 1 check (max_devices > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  activation_code text not null references public.activation_codes(code) on delete cascade,
  device_id text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (activation_code, device_id)
);

create index if not exists channels_enabled_sort_idx on public.channels(enabled, sort_order);
create index if not exists devices_activation_code_idx on public.devices(activation_code);

alter table public.channels enable row level security;
alter table public.activation_codes enable row level security;
alter table public.devices enable row level security;

-- Public app may only read enabled channels.
drop policy if exists "read enabled channels" on public.channels;
create policy "read enabled channels" on public.channels for select using (enabled = true);

-- Activation and device writes should be handled by a secure Edge Function or server.
-- Do not expose the service_role key in index.html, app.js, or any browser file.

insert into public.channels (name, short_name, category, stream_url, accent, description, enabled, featured, sort_order)
select 'Nova News','NEWS','أخبار','https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8','#1677ff','تغطية إخبارية متواصلة على مدار الساعة.',true,true,10
where not exists (select 1 from public.channels where name='Nova News');

insert into public.channels (name, short_name, category, stream_url, accent, description, enabled, featured, sort_order)
select 'Nova Sports 1','SPORT 1','رياضة','https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8','#10a875','مباريات وبرامج رياضية مباشرة بجودة عالية.',true,true,20
where not exists (select 1 from public.channels where name='Nova Sports 1');

insert into public.channels (name, short_name, category, stream_url, accent, description, enabled, featured, sort_order)
select 'Nova Cinema','CINEMA','أفلام','https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8','#7b3fe4','أفلام مختارة وتجربة سينمائية مميزة.',true,true,30
where not exists (select 1 from public.channels where name='Nova Cinema');

insert into public.activation_codes (code, enabled, expires_at, max_devices)
values ('NOVA-2026',true,'2027-12-31',3)
on conflict (code) do nothing;
