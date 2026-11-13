-- Career Radar single-owner workspace. Add the verified owner's email to private.owner_access separately.
create schema if not exists private;
revoke all on schema private from public;
create table private.owner_access(email text primary key check(email=lower(email)));
create function private.is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join private.owner_access o on o.email=lower(u.email) where u.id=(select auth.uid()) and u.email_confirmed_at is not null)
$$;
revoke all on function private.is_owner() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_owner() to authenticated;
create type public.recruitment_stage as enum ('discovered','subscribed','screening','interview','offer','hired');
create table public.applications(
 id uuid primary key default gen_random_uuid(),source_key text unique not null,
 company text not null check(length(trim(company))>0),position text not null check(length(trim(position))>0),
 stage public.recruitment_stage not null default 'discovered',outcome text not null default 'active' check(outcome in ('active','rejected','closed','excluded')),
 score integer not null default 0 check(score between 0 and 100),salary text not null default 'UNKNOWN',remote text not null default 'Unverified',eligibility text not null default '',
 deadline date,source_url text not null default '',next_action text not null default '',responsible text not null default 'Agent',
 submitted_at timestamptz,submission_verified boolean not null default false,confirmation text not null default '',notes text not null default '',source_status text not null default '',source_data jsonb not null default '{}',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint confirmed_evidence check(not submission_verified or length(trim(confirmation))>0),
 constraint submission_time_verified check(submitted_at is null or submission_verified)
);
create table public.tasks(
 id uuid primary key default gen_random_uuid(),application_id uuid references public.applications(id) on delete cascade,
 title text not null check(length(trim(title))>0),status text not null default 'pending' check(status in ('pending','blocked','completed')),
 last_stage public.recruitment_stage,responsible text not null default 'Agent',deadline date,url text not null default '',notes text not null default '',
 created_at timestamptz not null default now(),completed_at timestamptz,
 gmail_thread_id text,
 constraint completion_consistent check((status='completed')=(completed_at is not null)),
 constraint tasks_gmail_thread_id_key unique (gmail_thread_id),
 constraint tasks_email_review_check check (
  (gmail_thread_id is null and application_id is not null and last_stage is not null)
  or (
   gmail_thread_id is not null
   and gmail_thread_id ~ '^[A-Za-z0-9_-]+$'
   and responsible = 'Candidate'
   and ((application_id is null) = (last_stage is null))
   and url ~ '^https://mail[.]google[.]com/mail/u/([0-9]+/|[?]authuser=[A-Za-z0-9._+%@-]+)#all/[A-Za-z0-9_-]+$'
   and split_part(url, '#all/', 2) = gmail_thread_id
  )
 )
);
create table public.stage_events(
 id uuid primary key default gen_random_uuid(),application_id uuid not null references public.applications(id) on delete cascade,
 from_stage public.recruitment_stage,to_stage public.recruitment_stage not null,event_type text not null default 'stage_changed',evidence text not null default '',created_at timestamptz not null default now()
);
create table private.import_snapshots(id uuid primary key default gen_random_uuid(),source text not null,records jsonb not null,imported_at timestamptz not null default now());
create index applications_outcome_stage on public.applications(outcome,stage);
create index applications_submitted_at on public.applications(submitted_at) where submission_verified;
create index tasks_application_id on public.tasks(application_id);
create index tasks_queue on public.tasks(status,last_stage,deadline);
create index stage_events_application_created on public.stage_events(application_id,created_at desc);
create function private.audit_application() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.updated_at=now();
 if TG_OP='INSERT' then
  insert into public.stage_events(application_id,to_stage,event_type,evidence) values(new.id,new.stage,'created',new.confirmation);
 elsif old.stage is distinct from new.stage or old.outcome is distinct from new.outcome or old.submission_verified is distinct from new.submission_verified then
  insert into public.stage_events(application_id,from_stage,to_stage,event_type,evidence) values(new.id,old.stage,new.stage,case when old.outcome is distinct from new.outcome then 'outcome_'||new.outcome else 'stage_changed' end,new.confirmation);
 end if;
 return new;
end $$;
revoke all on function private.audit_application() from public;
create trigger audit_application after insert or update on public.applications for each row execute function private.audit_application();
alter table public.applications enable row level security;
alter table public.tasks enable row level security;
alter table public.stage_events enable row level security;
alter table private.import_snapshots enable row level security;
revoke all on public.applications,public.tasks,public.stage_events,private.import_snapshots from anon,authenticated;
grant select,insert,update on public.applications,public.tasks to authenticated;
grant select on public.stage_events to authenticated;
create policy owner_select on public.applications for select to authenticated using((select private.is_owner()));
create policy owner_insert on public.applications for insert to authenticated with check((select private.is_owner()));
create policy owner_update on public.applications for update to authenticated using((select private.is_owner())) with check((select private.is_owner()));
create policy owner_select on public.tasks for select to authenticated using((select private.is_owner()));
create policy owner_insert on public.tasks for insert to authenticated with check((select private.is_owner()));
create policy owner_update on public.tasks for update to authenticated using((select private.is_owner())) with check((select private.is_owner()));
create policy owner_read on public.stage_events for select to authenticated using((select private.is_owner()));
-- Snapshots intentionally inaccessible through the client Data API.

create function private.touch_application() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=clock_timestamp();return new;end $$;
revoke all on function private.touch_application() from public;
create trigger touch_application before update on public.applications for each row execute function private.touch_application();
alter table public.applications add constraint progressed_requires_verified check(stage='discovered' or submission_verified);
create policy snapshot_no_client_access on private.import_snapshots for all to authenticated using(false) with check(false);
