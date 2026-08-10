-- WL Credit V25.4
-- Customer-count based company receiving-bank allocation.
-- Allocation is based on customers owned by selected customer-service staff,
-- not on active-loan count.

begin;

create table if not exists public.bank_distribution_rules (
  bank_id uuid primary key references public.receiving_banks(id) on delete cascade,
  target_capacity integer not null default 0 check (target_capacity >= 0),
  auto_fill boolean not null default true,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_bank_assignments (
  bank_id uuid not null references public.receiving_banks(id) on delete cascade,
  staff_user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (bank_id, staff_user_id)
);

create table if not exists public.bank_customer_assignments (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  bank_id uuid not null references public.receiving_banks(id) on delete cascade,
  assignment_mode text not null default 'auto' check (assignment_mode in ('auto','manual')),
  locked boolean not null default false,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_bank_assignments_staff_idx
  on public.staff_bank_assignments(staff_user_id, bank_id);
create index if not exists bank_customer_assignments_bank_idx
  on public.bank_customer_assignments(bank_id, assigned_at);

alter table public.bank_distribution_rules enable row level security;
alter table public.staff_bank_assignments enable row level security;
alter table public.bank_customer_assignments enable row level security;

drop policy if exists bank_distribution_rules_staff_read on public.bank_distribution_rules;
create policy bank_distribution_rules_staff_read on public.bank_distribution_rules
for select to authenticated using (
  exists (select 1 from public.staff_profiles sp where sp.user_id=auth.uid() and sp.is_active=true)
);
drop policy if exists staff_bank_assignments_staff_read on public.staff_bank_assignments;
create policy staff_bank_assignments_staff_read on public.staff_bank_assignments
for select to authenticated using (
  exists (select 1 from public.staff_profiles sp where sp.user_id=auth.uid() and sp.is_active=true)
);
drop policy if exists bank_customer_assignments_staff_read on public.bank_customer_assignments;
create policy bank_customer_assignments_staff_read on public.bank_customer_assignments
for select to authenticated using (
  exists (select 1 from public.staff_profiles sp where sp.user_id=auth.uid() and sp.is_active=true)
);

grant select on public.bank_distribution_rules, public.staff_bank_assignments, public.bank_customer_assignments to authenticated;

create or replace function public.wl_configure_bank_distribution(
  p_bank_id uuid,
  p_target_capacity integer,
  p_staff_ids uuid[],
  p_auto_fill boolean default true
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_capacity integer := greatest(coalesce(p_target_capacity,0),0);
  v_assigned integer := 0;
  v_available integer := 0;
  v_customer record;
begin
  select lower(coalesce(role,'')) into v_role
  from public.staff_profiles
  where user_id=v_uid and is_active=true
  limit 1;

  if v_uid is null then
    return jsonb_build_object('ok',false,'error','Not authenticated');
  end if;
  if v_role not in ('finance','super_admin','superadmin') then
    return jsonb_build_object('ok',false,'error','Finance or Super Admin access required');
  end if;
  if not exists(select 1 from public.receiving_banks where id=p_bank_id) then
    return jsonb_build_object('ok',false,'error','Bank not found');
  end if;

  insert into public.bank_distribution_rules(bank_id,target_capacity,auto_fill,updated_by,updated_at)
  values(p_bank_id,v_capacity,coalesce(p_auto_fill,true),v_uid,now())
  on conflict(bank_id) do update set
    target_capacity=excluded.target_capacity,
    auto_fill=excluded.auto_fill,
    updated_by=excluded.updated_by,
    updated_at=excluded.updated_at;

  delete from public.staff_bank_assignments where bank_id=p_bank_id;
  insert into public.staff_bank_assignments(bank_id,staff_user_id)
  select p_bank_id,x
  from unnest(coalesce(p_staff_ids,array[]::uuid[])) x
  join public.staff_profiles sp on sp.user_id=x
  where sp.is_active=true and lower(coalesce(sp.role,''))='customer_service'
  on conflict do nothing;

  -- Remove only old automatic allocations for this bank whose customer is no longer
  -- owned by one of the selected staff. Manual/locked allocations remain untouched.
  update public.customers c
     set assigned_bank_id=null,
         updated_at=now()
   where c.assigned_bank_id=p_bank_id
     and not (c.owner_staff_id = any(coalesce(p_staff_ids,array[]::uuid[])))
     and not exists (
       select 1 from public.bank_customer_assignments bca
       where bca.customer_id=c.id and bca.bank_id=p_bank_id
         and (bca.assignment_mode='manual' or bca.locked=true)
     );

  delete from public.bank_customer_assignments bca
   using public.customers c
   where bca.customer_id=c.id
     and bca.bank_id=p_bank_id
     and bca.assignment_mode='auto'
     and bca.locked=false
     and not (c.owner_staff_id = any(coalesce(p_staff_ids,array[]::uuid[])));

  -- Count all selected staff customers, regardless of whether they currently have a loan.
  select count(*) into v_available
  from public.customers c
  where c.owner_staff_id = any(coalesce(p_staff_ids,array[]::uuid[]));

  -- Allocate selected staff customers to this bank, up to target capacity.
  -- Customers manually locked to another bank are never moved.
  for v_customer in
    select c.id
    from public.customers c
    left join public.bank_customer_assignments existing on existing.customer_id=c.id
    where c.owner_staff_id = any(coalesce(p_staff_ids,array[]::uuid[]))
      and not (
        existing.bank_id is distinct from p_bank_id
        and (existing.assignment_mode='manual' or existing.locked=true)
      )
    order by c.created_at nulls last, c.id
    limit case when v_capacity=0 then 2147483647 else v_capacity end
  loop
    update public.customers
       set assigned_bank_id=p_bank_id,
           updated_at=now()
     where id=v_customer.id;

    insert into public.bank_customer_assignments(
      customer_id,bank_id,assignment_mode,locked,assigned_by,assigned_at,updated_at
    ) values(
      v_customer.id,p_bank_id,'auto',false,v_uid,now(),now()
    )
    on conflict(customer_id) do update set
      bank_id=excluded.bank_id,
      assignment_mode=case when bank_customer_assignments.locked then bank_customer_assignments.assignment_mode else 'auto' end,
      locked=bank_customer_assignments.locked,
      assigned_by=excluded.assigned_by,
      assigned_at=excluded.assigned_at,
      updated_at=excluded.updated_at
    where bank_customer_assignments.locked=false
       or bank_customer_assignments.bank_id=p_bank_id;

    v_assigned := v_assigned + 1;
  end loop;

  return jsonb_build_object(
    'ok',true,
    'bank_id',p_bank_id,
    'target_capacity',v_capacity,
    'selected_staff_count',coalesce(array_length(p_staff_ids,1),0),
    'available_customer_count',v_available,
    'assigned_customer_count',v_assigned
  );
exception when others then
  return jsonb_build_object('ok',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;

grant execute on function public.wl_configure_bank_distribution(uuid,integer,uuid[],boolean) to authenticated;

-- Automatically fill a new/transferred customer into an eligible bank for that staff.
create or replace function public.wl_auto_fill_customer_bank()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_bank uuid;
begin
  if new.owner_staff_id is null or new.assigned_bank_id is not null then
    return new;
  end if;

  select sba.bank_id into v_bank
  from public.staff_bank_assignments sba
  join public.bank_distribution_rules r on r.bank_id=sba.bank_id and r.auto_fill=true
  where sba.staff_user_id=new.owner_staff_id
    and (
      r.target_capacity=0
      or (select count(*) from public.bank_customer_assignments b where b.bank_id=sba.bank_id) < r.target_capacity
    )
  order by
    case when r.target_capacity=0 then 0
         else (select count(*)::numeric / greatest(r.target_capacity,1) from public.bank_customer_assignments b where b.bank_id=sba.bank_id)
    end,
    sba.created_at
  limit 1;

  if v_bank is not null then
    new.assigned_bank_id := v_bank;
    insert into public.bank_customer_assignments(customer_id,bank_id,assignment_mode,locked,assigned_at,updated_at)
    values(new.id,v_bank,'auto',false,now(),now())
    on conflict(customer_id) do update set
      bank_id=excluded.bank_id,
      assignment_mode='auto',
      locked=false,
      assigned_at=excluded.assigned_at,
      updated_at=excluded.updated_at
    where bank_customer_assignments.locked=false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wl_auto_fill_customer_bank on public.customers;
create trigger trg_wl_auto_fill_customer_bank
before insert or update of owner_staff_id on public.customers
for each row execute function public.wl_auto_fill_customer_bank();

commit;
