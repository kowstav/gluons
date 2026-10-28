-- Gluons prototype: atomic workspace snapshots plus queryable relational projections.
-- Apply with Supabase CLI (`supabase db push`) or the SQL editor, then run seed.sql.
begin;
create extension if not exists pgcrypto;

create table public.workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 0,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.components (
  id text not null,
  version text not null,
  definition jsonb not null,
  primary key(id,version)
);
create table public.sector_packs (
  id text primary key,
  version text not null,
  definition jsonb not null
);
create table public.businesses (
  id text not null,
  owner_id uuid not null references public.workspaces(owner_id) on delete cascade,
  name text not null,
  sector_pack_id text not null,
  mode text not null check(mode in ('trial','live')),
  setup jsonb not null,
  primary key(owner_id,id)
);
create table public.integrations (
  id text not null,
  owner_id uuid not null references public.workspaces(owner_id) on delete cascade,
  business_id text not null,
  sector_pack_id text not null,
  components jsonb not null,
  setup jsonb not null,
  primary key(owner_id,id),
  foreign key(owner_id,business_id) references public.businesses(owner_id,id) on delete cascade
);
create table public.tasks (
  id text not null,
  owner_id uuid not null references public.workspaces(owner_id) on delete cascade,
  business_id text not null,
  component_id text not null,
  trigger text not null,
  difficulty text not null,
  model text not null,
  cost_usd numeric not null check(cost_usd>=0),
  duration_ms integer not null check(duration_ms>=0),
  created_at timestamptz not null,
  payload jsonb not null,
  primary key(owner_id,id),
  foreign key(owner_id,business_id) references public.businesses(owner_id,id) on delete cascade
);
create table public.proposed_actions (
  id text not null,
  owner_id uuid not null references public.workspaces(owner_id) on delete cascade,
  business_id text not null,
  task_id text not null,
  status text not null check(status in ('pending','approved','rejected','executing','executed','simulated','execution_unknown')),
  approved_by text,
  mode text not null check(mode in ('trial','live')),
  payload jsonb not null,
  primary key(owner_id,id),
  foreign key(owner_id,business_id) references public.businesses(owner_id,id) on delete cascade,
  foreign key(owner_id,task_id) references public.tasks(owner_id,id) on delete cascade
);
create table public.baselines (
  owner_id uuid not null,
  business_id text not null,
  monthly_staff_cost numeric not null check(monthly_staff_cost>=0),
  monthly_staff_hours numeric not null check(monthly_staff_hours>0),
  review_minutes_per_task numeric not null check(review_minutes_per_task>=0),
  primary key(owner_id,business_id),
  foreign key(owner_id,business_id) references public.businesses(owner_id,id) on delete cascade
);
create table public.savings_snapshots (
  owner_id uuid not null,
  business_id text not null,
  revision integer not null,
  estimated_hours numeric not null,
  ai_cost_usd numeric not null,
  captured_at timestamptz not null default now(),
  primary key(owner_id,business_id,revision),
  foreign key(owner_id,business_id) references public.businesses(owner_id,id) on delete cascade
);
create table public.audit_events (
  id text not null,
  owner_id uuid not null references public.workspaces(owner_id) on delete cascade,
  business_id text not null,
  at timestamptz not null,
  payload jsonb not null,
  primary key(owner_id,id)
);
create table public.effects (
  id text not null,
  owner_id uuid not null references public.workspaces(owner_id) on delete cascade,
  business_id text not null,
  action_id text not null,
  payload jsonb not null,
  primary key(owner_id,id),
  unique(owner_id,action_id)
);
create table public.trial_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 2 and 100),
  email text not null check(length(email) between 3 and 180),
  business text not null check(length(business) between 2 and 120),
  created_at timestamptz not null default now()
);
create index tasks_business_created on public.tasks(owner_id,business_id,created_at desc);
create index actions_queue on public.proposed_actions(owner_id,business_id,status);
create unique index tasks_event_dedup on public.tasks(owner_id,business_id,(payload->>'eventId')) where payload->>'eventId' is not null;

-- Snapshot writes and their projections are committed in the same database transaction.
-- Compare-and-swap rejects concurrent stale decisions before any external effect can be claimed.
create function public.save_workspace(payload jsonb, expected_revision integer, target_owner uuid)
returns void language plpgsql security definer set search_path=public as $$
declare current_revision integer; b jsonb; ws_revision integer;
begin
  if auth.role() <> 'service_role' and (auth.uid() is null or auth.uid() <> target_owner) then
    raise exception 'not_authorized';
  end if;
  if jsonb_typeof(payload->'businesses') <> 'array' or jsonb_typeof(payload->'tasks') <> 'array' or jsonb_typeof(payload->'actions') <> 'array' then
    raise exception 'invalid_workspace';
  end if;
  ws_revision := (payload->>'revision')::integer;
  if ws_revision <> expected_revision+1 then raise exception 'invalid_revision'; end if;
  select revision into current_revision from public.workspaces where owner_id=target_owner for update;
  if not found then
    if expected_revision <> -1 then raise exception 'revision_conflict'; end if;
    insert into public.workspaces(owner_id,revision,state) values(target_owner,ws_revision,payload);
  else
    if current_revision <> expected_revision then raise exception 'revision_conflict'; end if;
    update public.workspaces set state=payload,revision=ws_revision,updated_at=now() where owner_id=target_owner;
  end if;

  -- Prototype-sized workspace: replace projections atomically. Snapshot is authoritative.
  delete from public.effects where owner_id=target_owner;
  delete from public.audit_events where owner_id=target_owner;
  delete from public.proposed_actions where owner_id=target_owner;
  delete from public.tasks where owner_id=target_owner;
  delete from public.integrations where owner_id=target_owner;
  delete from public.baselines where owner_id=target_owner;
  -- Keep existing businesses so historical savings snapshots retain their FK targets.
  insert into public.businesses(id,owner_id,name,sector_pack_id,mode,setup)
    select x->>'id',target_owner,x->>'name',x->>'sectorPackId',x->>'mode',x from jsonb_array_elements(payload->'businesses') x
    on conflict(owner_id,id) do update set name=excluded.name,sector_pack_id=excluded.sector_pack_id,mode=excluded.mode,setup=excluded.setup;
  insert into public.baselines(owner_id,business_id,monthly_staff_cost,monthly_staff_hours,review_minutes_per_task)
    select target_owner,x->>'id',(x->'baseline'->>'monthlyStaffCost')::numeric,(x->'baseline'->>'monthlyStaffHours')::numeric,(x->'baseline'->>'reviewMinutesPerTask')::numeric from jsonb_array_elements(payload->'businesses') x;
  insert into public.integrations(id,owner_id,business_id,sector_pack_id,components,setup)
    select x->>'id',target_owner,x->>'businessId',x->>'sectorPackId',x->'componentIds',x from jsonb_array_elements(payload->'integrations') x;
  insert into public.tasks(id,owner_id,business_id,component_id,trigger,difficulty,model,cost_usd,duration_ms,created_at,payload)
    select x->>'id',target_owner,x->>'businessId',x->>'componentId',x->>'trigger',x->'decision'->>'difficulty',x->>'model',(x->>'costUsd')::numeric,(x->>'durationMs')::integer,(x->>'createdAt')::timestamptz,x from jsonb_array_elements(payload->'tasks') x;
  insert into public.proposed_actions(id,owner_id,business_id,task_id,status,approved_by,mode,payload)
    select x->>'id',target_owner,x->>'businessId',x->>'taskId',x->>'status',x->>'approvedBy',x->>'mode',x from jsonb_array_elements(payload->'actions') x;
  insert into public.audit_events(id,owner_id,business_id,at,payload)
    select x->>'id',target_owner,x->>'businessId',(x->>'at')::timestamptz,x from jsonb_array_elements(payload->'audit') x;
  insert into public.effects(id,owner_id,business_id,action_id,payload)
    select x->>'id',target_owner,x->>'businessId',x->>'actionId',x from jsonb_array_elements(payload->'effects') x;
  for b in select value from jsonb_array_elements(payload->'businesses') loop
    insert into public.savings_snapshots(owner_id,business_id,revision,estimated_hours,ai_cost_usd)
    select target_owner,b->>'id',ws_revision,
      greatest(0,coalesce((select sum((t->>'humanMinutes')::numeric) from jsonb_array_elements(payload->'tasks') t where t->>'businessId'=b->>'id' and exists(select 1 from jsonb_array_elements(payload->'actions') a where a->>'taskId'=t->>'id' and a->>'status' in ('executed','simulated'))),0) - (select count(*) from jsonb_array_elements(payload->'actions') a where a->>'businessId'=b->>'id' and a->>'status'<>'pending')*(b->'baseline'->>'reviewMinutesPerTask')::numeric)/60,
      coalesce((select sum((t->>'costUsd')::numeric) from jsonb_array_elements(payload->'tasks') t where t->>'businessId'=b->>'id'),0);
  end loop;
end; $$;
revoke all on function public.save_workspace(jsonb,integer,uuid) from public,anon;
grant execute on function public.save_workspace(jsonb,integer,uuid) to authenticated,service_role;

-- Owner isolation applies to both direct SQL views and Realtime subscriptions.
do $$ declare tbl text; begin
  foreach tbl in array array['workspaces','businesses','integrations','tasks','proposed_actions','baselines','savings_snapshots','audit_events','effects'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('create policy owner_read on public.%I for select to authenticated using (auth.uid()=owner_id)',tbl);
    execute format('revoke all on public.%I from anon,authenticated',tbl);
    execute format('grant select on public.%I to authenticated',tbl);
  end loop;
end $$;
alter table public.components enable row level security;
alter table public.sector_packs enable row level security;
create policy library_components on public.components for select to authenticated using(true);
create policy library_packs on public.sector_packs for select to authenticated using(true);
revoke all on public.components,public.sector_packs from anon,authenticated;
grant select on public.components,public.sector_packs to authenticated;
alter table public.trial_requests enable row level security;
revoke all on public.trial_requests from anon,authenticated;
grant insert on public.trial_requests to anon,authenticated;
create policy request_a_trial on public.trial_requests for insert to anon,authenticated with check(true);
-- Trial requests are read by the project operator through the Supabase dashboard, not by visitors.
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='workspaces') then
    alter publication supabase_realtime add table public.workspaces;
  end if;
end $$;
commit;
