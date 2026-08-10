-- WL Credit V23 Enterprise
-- 1) Canonical customer account = WL001, WL002, ...
-- 2) Manual overdue amount per active loan
-- 3) Customer portal reads loans.overdue_charge immediately
-- Safe and idempotent. Existing business records are not deleted.

begin;

alter table public.customers add column if not exists username text;
create sequence if not exists public.customer_username_seq start with 1 increment by 1;

-- Assign/repair all public customer usernames.
do $$
declare r record; candidate text;
begin
  for r in select id,username,customer_code from public.customers order by created_at nulls last,id loop
    candidate:=upper(btrim(coalesce(r.username,r.customer_code,'')));
    if candidate !~ '^WL[0-9]+$' then
      loop
        candidate:='WL'||lpad(nextval('public.customer_username_seq')::text,3,'0');
        exit when not exists(select 1 from public.customers c where c.id<>r.id and (upper(coalesce(c.username,''))=candidate or upper(coalesce(c.customer_code,''))=candidate));
      end loop;
    end if;
    update public.customers set username=candidate,customer_code=candidate where id=r.id;
  end loop;
end $$;

select setval('public.customer_username_seq',greatest(coalesce((select max((substring(username from '[0-9]+$'))::bigint) from public.customers where username~'^WL[0-9]+$'),0),1),true);

create or replace function public.assign_wl_customer_identity()
returns trigger language plpgsql security definer set search_path=public as $$
declare candidate text;
begin
  candidate:=upper(btrim(coalesce(new.username,new.customer_code,'')));
  if candidate !~ '^WL[0-9]+$' then
    loop
      candidate:='WL'||lpad(nextval('public.customer_username_seq')::text,3,'0');
      exit when not exists(select 1 from public.customers c where c.id is distinct from new.id and (upper(coalesce(c.username,''))=candidate or upper(coalesce(c.customer_code,''))=candidate));
    end loop;
  end if;
  new.username:=candidate;new.customer_code:=candidate;return new;
end $$;

drop trigger if exists trg_assign_wl_customer_identity on public.customers;
create trigger trg_assign_wl_customer_identity before insert or update of username,customer_code on public.customers for each row execute function public.assign_wl_customer_identity();
create unique index if not exists customers_username_unique on public.customers(upper(username));

alter table public.loans add column if not exists overdue_charge numeric(14,2) not null default 0;
alter table public.loans add column if not exists overdue_note text;
alter table public.loans add column if not exists overdue_updated_at timestamptz;
alter table public.loans add column if not exists overdue_updated_by uuid;

create or replace function public.wl_set_loan_overdue_charge(p_loan_id uuid,p_amount numeric,p_note text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_role text;v_loan public.loans%rowtype;
begin
  select role into v_role from public.staff_profiles where user_id=auth.uid() limit 1;
  if v_role is null then return jsonb_build_object('ok',false,'error','Staff account required');end if;
  if coalesce(p_amount,0)<0 then return jsonb_build_object('ok',false,'error','Overdue amount cannot be negative');end if;
  select * into v_loan from public.loans where id=p_loan_id for update;
  if not found then return jsonb_build_object('ok',false,'error','Loan not found');end if;
  if v_loan.status<>'active' and coalesce(p_amount,0)>0 then return jsonb_build_object('ok',false,'error','Only active loans can receive an overdue charge');end if;
  update public.loans set overdue_charge=round(coalesce(p_amount,0),2),overdue_note=nullif(btrim(coalesce(p_note,'')),''),overdue_updated_at=now(),overdue_updated_by=auth.uid(),updated_at=now() where id=p_loan_id;
  return jsonb_build_object('ok',true,'loan_id',p_loan_id,'overdue_charge',round(coalesce(p_amount,0),2));
end $$;

grant execute on function public.wl_set_loan_overdue_charge(uuid,numeric,text) to authenticated;

-- Realtime: safe if already present.
do $$ begin
  alter publication supabase_realtime add table public.loans;
exception when duplicate_object then null; when undefined_object then null;
end $$;

commit;

-- Verification:
-- select username,customer_code,full_name from public.customers order by username;
-- select loan_id,overdue_charge,overdue_note from public.loans order by created_at desc;
