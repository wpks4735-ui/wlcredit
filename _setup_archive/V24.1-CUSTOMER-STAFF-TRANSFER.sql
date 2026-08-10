-- WL Credit V24.1
-- Transfer a whole customer from one customer-service staff member to another.
-- Finance and Super Admin only. Existing loans/payments are preserved.

begin;

alter table public.customers add column if not exists owner_staff_id uuid;

create table if not exists public.customer_staff_transfer_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  old_staff_id uuid,
  new_staff_id uuid not null,
  reason text not null,
  transferred_by uuid not null,
  transferred_at timestamptz not null default now(),
  bank_unassigned boolean not null default false
);
create index if not exists customer_staff_transfer_history_customer_idx
  on public.customer_staff_transfer_history(customer_id, transferred_at desc);

alter table public.customer_staff_transfer_history enable row level security;
drop policy if exists customer_staff_transfer_history_read on public.customer_staff_transfer_history;
create policy customer_staff_transfer_history_read
on public.customer_staff_transfer_history for select to authenticated
using (
  exists (
    select 1 from public.staff_profiles sp
    where sp.user_id=auth.uid() and sp.is_active=true
  )
);
grant select on public.customer_staff_transfer_history to authenticated;

create or replace function public.wl_transfer_customer(
  p_customer_id uuid,
  p_target_staff_id uuid,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_old_staff uuid;
  v_bank uuid;
  v_bank_unassigned boolean := false;
  v_target_role text;
  v_sql text;
begin
  if v_uid is null then
    return jsonb_build_object('ok',false,'error','Not authenticated');
  end if;

  select lower(coalesce(role,'')) into v_role
  from public.staff_profiles
  where user_id=v_uid and is_active=true
  limit 1;

  if v_role not in ('finance','super_admin','superadmin') then
    return jsonb_build_object('ok',false,'error','Finance or Super Admin access required');
  end if;

  if nullif(trim(coalesce(p_reason,'')),'') is null then
    return jsonb_build_object('ok',false,'error','Transfer reason is required');
  end if;

  select lower(coalesce(role,'')) into v_target_role
  from public.staff_profiles
  where user_id=p_target_staff_id and is_active=true
  limit 1;

  if v_target_role is distinct from 'customer_service' then
    return jsonb_build_object('ok',false,'error','Target staff must be an active customer service user');
  end if;

  select owner_staff_id, assigned_bank_id
    into v_old_staff, v_bank
  from public.customers
  where id=p_customer_id
  for update;

  if not found then
    return jsonb_build_object('ok',false,'error','Customer not found');
  end if;

  if v_old_staff is not distinct from p_target_staff_id then
    return jsonb_build_object('ok',false,'error','Customer is already assigned to this staff member');
  end if;

  -- If the customer's receiving bank is not assigned to the new staff member,
  -- remove the current customer-level bank allocation so it can be reassigned safely.
  if v_bank is not null
     and to_regclass('public.staff_bank_assignments') is not null
     and not exists (
       select 1 from public.staff_bank_assignments sba
       where sba.staff_user_id=p_target_staff_id and sba.bank_id=v_bank
     ) then
    update public.customers
       set assigned_bank_id=null
     where id=p_customer_id;
    v_bank_unassigned := true;

    if to_regclass('public.bank_customer_assignments') is not null then
      delete from public.bank_customer_assignments where customer_id=p_customer_id;
    end if;
  end if;

  update public.customers
     set owner_staff_id=p_target_staff_id,
         updated_at=now()
   where id=p_customer_id;

  -- Keep compatible ownership columns synchronized when they exist.
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='customers' and column_name='claimed_by') then
    execute 'update public.customers set claimed_by=$1 where id=$2' using p_target_staff_id,p_customer_id;
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='customers' and column_name='assigned_staff_id') then
    execute 'update public.customers set assigned_staff_id=$1 where id=$2' using p_target_staff_id,p_customer_id;
  end if;

  -- Update loan ownership helper columns if present. Customer ownership remains the source of truth.
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='loans' and column_name='owner_staff_id') then
    execute 'update public.loans set owner_staff_id=$1, updated_at=now() where customer_id=$2' using p_target_staff_id,p_customer_id;
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='loans' and column_name='assigned_staff_id') then
    execute 'update public.loans set assigned_staff_id=$1, updated_at=now() where customer_id=$2' using p_target_staff_id,p_customer_id;
  end if;

  -- Update payment workflow routing for all non-final submissions belonging to the customer.
  if to_regclass('public.payment_submissions') is not null then
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='payment_submissions' and column_name='owner_staff_id') then
      execute $q$
        update public.payment_submissions ps
           set owner_staff_id=$1, updated_at=now()
         where ps.loan_id in (select id from public.loans where customer_id=$2)
           and lower(coalesce(ps.status,'')) not in ('completed','approved','paid','rejected','failed','cancelled')
      $q$ using p_target_staff_id,p_customer_id;
    end if;
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='payment_submissions' and column_name='assigned_staff_id') then
      execute $q$
        update public.payment_submissions ps
           set assigned_staff_id=$1, updated_at=now()
         where ps.loan_id in (select id from public.loans where customer_id=$2)
           and lower(coalesce(ps.status,'')) not in ('completed','approved','paid','rejected','failed','cancelled')
      $q$ using p_target_staff_id,p_customer_id;
    end if;
  end if;

  -- Update application routing records linked to the customer when the schema supports it.
  if to_regclass('public.loan_applications') is not null
     and exists(select 1 from information_schema.columns where table_schema='public' and table_name='loan_applications' and column_name='customer_id') then
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='loan_applications' and column_name='owner_staff_id') then
      execute 'update public.loan_applications set owner_staff_id=$1 where customer_id=$2' using p_target_staff_id,p_customer_id;
    end if;
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='loan_applications' and column_name='assigned_staff_id') then
      execute 'update public.loan_applications set assigned_staff_id=$1 where customer_id=$2' using p_target_staff_id,p_customer_id;
    end if;
  end if;

  insert into public.customer_staff_transfer_history(
    customer_id,old_staff_id,new_staff_id,reason,transferred_by,bank_unassigned
  ) values(
    p_customer_id,v_old_staff,p_target_staff_id,trim(p_reason),v_uid,v_bank_unassigned
  );

  -- Best-effort audit log, without making the transfer depend on one legacy audit schema.
  if to_regclass('public.audit_logs') is not null then
    begin
      insert into public.audit_logs(action,entity_type,entity_id,details,staff_user_id,created_at)
      values(
        'transfer_customer','customer',p_customer_id,
        jsonb_build_object('old_staff_id',v_old_staff,'new_staff_id',p_target_staff_id,'reason',trim(p_reason),'bank_unassigned',v_bank_unassigned),
        v_uid,now()
      );
    exception when undefined_column then
      null;
    end;
  end if;

  return jsonb_build_object(
    'ok',true,
    'customer_id',p_customer_id,
    'old_staff_id',v_old_staff,
    'new_staff_id',p_target_staff_id,
    'bank_unassigned',v_bank_unassigned
  );
exception
  when others then
    return jsonb_build_object('ok',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;

grant execute on function public.wl_transfer_customer(uuid,uuid,text) to authenticated;

commit;
