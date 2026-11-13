-- One expiring claim per application or other independently coordinated resource.
create table private.recruiting_claims (
  resource text primary key check (btrim(resource) <> ''),
  run_id uuid not null,
  expires_at timestamptz not null
);
alter table private.recruiting_claims enable row level security;
revoke all on private.recruiting_claims from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.recruiting_claims to service_role;

create function private.recruiting_claim(p_resource text, p_run_id uuid, p_action text default 'acquire')
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_resource is null or btrim(p_resource) = '' or p_run_id is null then
    raise exception 'Resource and run ID are required';
  end if;

  if p_action = 'acquire' then
    insert into private.recruiting_claims as claim (resource, run_id, expires_at)
    values (p_resource, p_run_id, clock_timestamp() + interval '15 minutes')
    on conflict (resource) do update
      set run_id = excluded.run_id,
          expires_at = clock_timestamp() + interval '15 minutes'
      where claim.expires_at <= clock_timestamp() or claim.run_id = p_run_id;
  elsif p_action = 'renew' then
    update private.recruiting_claims
    set expires_at = clock_timestamp() + interval '15 minutes'
    where resource = p_resource and run_id = p_run_id and expires_at > clock_timestamp();
  elsif p_action = 'release' then
    delete from private.recruiting_claims
    where resource = p_resource and run_id = p_run_id;
  else
    raise exception 'Action must be acquire, renew or release';
  end if;

  return found;
end;
$$;
revoke all on function private.recruiting_claim(text, uuid, text) from public, anon, authenticated;
grant execute on function private.recruiting_claim(text, uuid, text) to service_role;

-- Retire the singleton only after the current legacy run has released or expired.
lock table private.recruiting_run_lock in access exclusive mode;
do $$
begin
  if exists (select 1 from private.recruiting_run_lock where expires_at > clock_timestamp()) then
    raise exception 'A legacy recruiting run is still active. Retry after it releases or expires.';
  end if;
end;
$$;

create or replace function private.recruiting_lock(p_run_id uuid, p_action text default 'acquire')
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Recruiting now uses per-application claims. Reload AGENTS.md from main.';
end;
$$;

drop table private.recruiting_run_lock;
