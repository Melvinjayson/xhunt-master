-- Allow any authenticated user to read basic info (name, slug, logo_url)
-- for tenants that have at least one public, live mission.
-- This enables the consumer missions feed to show sponsor branding
-- without exposing private tenant settings.

create policy "read_public_mission_tenants"
  on public.tenants for select
  using (
    exists (
      select 1
      from public.missions m
      where m.tenant_id = tenants.id
        and m.is_public  = true
        and m.status in ('active', 'published')
    )
  );

-- Allow reading approved mission_approvals so the consumer app can show
-- a "Verified" badge on missions that have passed admin review.
alter table public.mission_approvals enable row level security;

create policy "read_approved_approvals"
  on public.mission_approvals for select
  using (status = 'approved');
