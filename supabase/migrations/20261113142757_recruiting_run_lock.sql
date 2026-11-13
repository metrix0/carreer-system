-- One shared lease for all recruiting chats and scheduled runs.
create table private.recruiting_run_lock (
 singleton boolean primary key default true check(singleton),
 run_id uuid not null,
 expires_at timestamptz not null
);
alter table private.recruiting_run_lock enable row level security;
revoke all on private.recruiting_run_lock from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update,delete on private.recruiting_run_lock to service_role;

create function private.recruiting_lock(p_run_id uuid, p_action text default 'acquire')
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_run_id is null then raise exception 'run_id required'; end if;
 if p_action='acquire' then
  insert into private.recruiting_run_lock(singleton,run_id,expires_at)
  values(true,p_run_id,clock_timestamp()+interval '15 minutes')
  on conflict(singleton) do update
   set run_id=excluded.run_id, expires_at=clock_timestamp()+interval '15 minutes'
   where recruiting_run_lock.expires_at<=clock_timestamp()
      or recruiting_run_lock.run_id=p_run_id;
 elsif p_action='renew' then
  update private.recruiting_run_lock set expires_at=clock_timestamp()+interval '15 minutes'
   where singleton and run_id=p_run_id and expires_at>clock_timestamp();
 elsif p_action='release' then
  delete from private.recruiting_run_lock where singleton and run_id=p_run_id;
 else
  raise exception 'Action must be acquire, renew or release';
 end if;
 return found;
end $$;
revoke all on function private.recruiting_lock(uuid,text) from public,anon,authenticated;
grant execute on function private.recruiting_lock(uuid,text) to service_role;
