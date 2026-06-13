-- Allow authenticated users to create their own tenant during onboarding.
-- Without this policy, newly registered users (role='participant', tenant_id=NULL)
-- cannot INSERT into tenants, causing the workspace setup flow to fail.
create policy "authenticated_create_tenant" on public.tenants
  for insert
  to authenticated
  with check (true);
