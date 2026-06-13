-- ============================================================
-- X-hunt Multi-Tenant Schema  — Sprint 1
-- ============================================================

-- ---- Tenants -----------------------------------------------
create table if not exists public.tenants (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        unique not null,
  logo_url    text,
  plan        text        not null default 'starter'
                          check (plan in ('starter','growth','enterprise')),
  settings    jsonb       not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- User profiles -----------------------------------------
create table if not exists public.user_profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  tenant_id           uuid        references public.tenants(id) on delete set null,
  role                text        not null default 'participant'
                                  check (role in (
                                    'platform_admin','tenant_admin',
                                    'mission_creator','analyst','participant'
                                  )),
  display_name        text,
  avatar_url          text,
  interests           text[]      not null default '{}',
  goals               text[]      not null default '{}',
  onboarding_complete boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---- Missions ----------------------------------------------
create table if not exists public.missions (
  id              uuid        primary key default gen_random_uuid(),
  tenant_id       uuid        not null references public.tenants(id) on delete cascade,
  created_by      uuid        references public.user_profiles(id) on delete set null,
  title           text        not null,
  story_context   text,
  difficulty      text        not null default 'medium'
                              check (difficulty in ('easy','medium','hard')),
  estimated_time  text,
  steps           jsonb       not null default '[]',
  reward          text        not null default '',
  tags            text[]      not null default '{}',
  status          text        not null default 'active'
                              check (status in ('draft','active','archived')),
  is_public       boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---- Mission progress --------------------------------------
create table if not exists public.mission_progress (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.user_profiles(id) on delete cascade,
  mission_id          uuid        not null references public.missions(id) on delete cascade,
  tenant_id           uuid        references public.tenants(id),
  current_step_index  integer     not null default 0,
  completed_steps     integer[]   not null default '{}',
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  unique(user_id, mission_id)
);

-- ---- Reward events -----------------------------------------
create table if not exists public.reward_events (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.user_profiles(id) on delete cascade,
  mission_id   uuid        not null references public.missions(id),
  tenant_id    uuid        references public.tenants(id),
  reward_type  text        not null default 'badge',
  reward_value jsonb       not null default '{}',
  redeemed     boolean     not null default false,
  issued_at    timestamptz not null default now()
);

-- ---- Analytics events ---------------------------------------
create table if not exists public.analytics_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references public.user_profiles(id),
  tenant_id   uuid        references public.tenants(id),
  event_type  text        not null,
  mission_id  uuid        references public.missions(id),
  metadata    jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.tenants           enable row level security;
alter table public.user_profiles     enable row level security;
alter table public.missions          enable row level security;
alter table public.mission_progress  enable row level security;
alter table public.reward_events     enable row level security;
alter table public.analytics_events  enable row level security;

-- Helper: current user's tenant
create or replace function public.my_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from public.user_profiles where id = auth.uid()
$$;

-- Helper: current user's role
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.user_profiles where id = auth.uid()
$$;

-- ---- Tenants policies
create policy "read_own_tenant"   on public.tenants for select
  using (id = public.my_tenant_id());

create policy "admin_update_tenant" on public.tenants for update
  using (id = public.my_tenant_id() and public.my_role() in ('tenant_admin','platform_admin'));

-- ---- User profiles policies
create policy "read_tenant_users"   on public.user_profiles for select
  using (id = auth.uid() or tenant_id = public.my_tenant_id());

create policy "insert_own_profile"  on public.user_profiles for insert
  with check (id = auth.uid());

create policy "update_own_profile"  on public.user_profiles for update
  using (id = auth.uid());

-- ---- Missions policies
create policy "tenant_read_missions"   on public.missions for select
  using (tenant_id = public.my_tenant_id() or is_public = true);

create policy "creator_insert_missions" on public.missions for insert
  with check (
    tenant_id = public.my_tenant_id() and
    public.my_role() in ('mission_creator','tenant_admin','platform_admin')
  );

create policy "creator_update_missions" on public.missions for update
  using (
    tenant_id = public.my_tenant_id() and
    (created_by = auth.uid() or public.my_role() in ('tenant_admin','platform_admin'))
  );

create policy "admin_delete_missions" on public.missions for delete
  using (
    tenant_id = public.my_tenant_id() and
    public.my_role() in ('tenant_admin','platform_admin')
  );

-- ---- Progress policies
create policy "own_progress" on public.mission_progress for all
  using (user_id = auth.uid());

-- ---- Reward events policies
create policy "read_rewards" on public.reward_events for select
  using (user_id = auth.uid() or tenant_id = public.my_tenant_id());

create policy "insert_rewards" on public.reward_events for insert
  with check (user_id = auth.uid());

-- ---- Analytics policies
create policy "tenant_analytics" on public.analytics_events for select
  using (tenant_id = public.my_tenant_id());

create policy "insert_events" on public.analytics_events for insert
  with check (user_id = auth.uid());

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
