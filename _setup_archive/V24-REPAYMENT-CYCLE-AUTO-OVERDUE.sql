-- WL Credit V24: repayment cycles, automatic due dates and cumulative overdue fees
-- Run once in Supabase SQL Editor.

alter table public.loans add column if not exists repayment_cycle_type text;
alter table public.loans add column if not exists repayment_cycle_value integer;
alter table public.loans add column if not exists due_at timestamptz;
alter table public.loans add column if not exists collection_due_at timestamptz;
alter table public.loans add column if not exists overdue_fee_amount numeric(14,2) not null default 200;
alter table public.loans add column if not exists auto_overdue_enabled boolean not null default true;

alter table public.loan_applications add column if not exists repayment_cycle_type text;
alter table public.loan_applications add column if not exists repayment_cycle_value integer;
alter table public.loan_applications add column if not exists first_due_at timestamptz;

update public.loans
set repayment_cycle_type=coalesce(repayment_cycle_type,'monthly'),
    repayment_cycle_value=coalesce(repayment_cycle_value,1),
    due_at=coalesce(due_at, case when due_date is not null then ((due_date::date + time '23:59:59') at time zone 'Asia/Kuala_Lumpur') end),
    collection_due_at=coalesce(collection_due_at,due_at,case when due_date is not null then ((due_date::date + time '23:59:59') at time zone 'Asia/Kuala_Lumpur') end)
where repayment_cycle_type is null or repayment_cycle_value is null or due_at is null or collection_due_at is null;

alter table public.loans drop constraint if exists loans_repayment_cycle_type_check;
alter table public.loans add constraint loans_repayment_cycle_type_check check (repayment_cycle_type in ('monthly','daily'));
alter table public.loans drop constraint if exists loans_repayment_cycle_value_check;
alter table public.loans add constraint loans_repayment_cycle_value_check check (repayment_cycle_value between 1 and 3650);

create table if not exists public.loan_due_date_history (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  old_due_at timestamptz,
  new_due_at timestamptz not null,
  reason text not null,
  change_type text not null default 'manual',
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create table if not exists public.loan_overdue_events (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  assessed_due_at timestamptz not null,
  amount numeric(14,2) not null,
  status text not null default 'active' check (status in ('active','cancelled','paid','adjusted')),
  source text not null default 'automatic',
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  cancelled_by uuid,
  cancelled_at timestamptz,
  cancel_reason text
);
create unique index if not exists loan_overdue_events_one_auto_per_due
on public.loan_overdue_events(loan_id,assessed_due_at)
where source='automatic';

alter table public.loan_due_date_history enable row level security;
alter table public.loan_overdue_events enable row level security;

drop policy if exists staff_read_due_history on public.loan_due_date_history;
create policy staff_read_due_history on public.loan_due_date_history for select to authenticated using (true);
drop policy if exists staff_read_overdue_events on public.loan_overdue_events;
create policy staff_read_overdue_events on public.loan_overdue_events for select to authenticated using (true);

create or replace function public.wl_is_active_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.staff_profiles where user_id=auth.uid() and coalesce(is_active,true)=true)
$$;

grant execute on function public.wl_is_active_staff() to authenticated;

create or replace function public.wl_calculate_next_due(p_current timestamptz,p_cycle_type text,p_cycle_value integer)
returns timestamptz language plpgsql immutable as $$
begin
  if p_current is null then return null; end if;
  if p_cycle_type='monthly' then return p_current + make_interval(months=>greatest(coalesce(p_cycle_value,1),1)); end if;
  return p_current + make_interval(days=>greatest(coalesce(p_cycle_value,1),1));
end $$;

grant execute on function public.wl_calculate_next_due(timestamptz,text,integer) to authenticated;

create or replace function public.wl_set_loan_repayment_cycle(
 p_loan_id uuid,p_cycle_type text,p_cycle_value integer,p_due_at timestamptz,p_reason text default 'Repayment schedule configured')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_old timestamptz;
begin
 if not public.wl_is_active_staff() then return jsonb_build_object('ok',false,'error','Staff access required'); end if;
 if p_cycle_type not in ('monthly','daily') then return jsonb_build_object('ok',false,'error','Invalid repayment cycle'); end if;
 if coalesce(p_cycle_value,0)<1 then return jsonb_build_object('ok',false,'error','Cycle value must be at least 1'); end if;
 if p_due_at is null then return jsonb_build_object('ok',false,'error','Due date is required'); end if;
 select coalesce(collection_due_at,due_at,case when due_date is not null then ((due_date::date+time '23:59:59') at time zone 'Asia/Kuala_Lumpur') end) into v_old from public.loans where id=p_loan_id for update;
 if not found then return jsonb_build_object('ok',false,'error','Loan not found'); end if;
 update public.loans set repayment_cycle_type=p_cycle_type,repayment_cycle_value=p_cycle_value,due_at=p_due_at,collection_due_at=p_due_at,due_date=(p_due_at at time zone 'Asia/Kuala_Lumpur')::date,updated_at=now() where id=p_loan_id;
 insert into public.loan_due_date_history(loan_id,old_due_at,new_due_at,reason,change_type,changed_by) values(p_loan_id,v_old,p_due_at,coalesce(nullif(btrim(p_reason),''),'Repayment schedule configured'),'schedule',auth.uid());
 return jsonb_build_object('ok',true,'next_due_at',p_due_at);
end $$;

grant execute on function public.wl_set_loan_repayment_cycle(uuid,text,integer,timestamptz,text) to authenticated;

create or replace function public.wl_change_loan_due_at(p_loan_id uuid,p_new_due_at timestamptz,p_reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_old timestamptz;
begin
 if not public.wl_is_active_staff() then return jsonb_build_object('ok',false,'error','Staff access required'); end if;
 if p_new_due_at is null or nullif(btrim(coalesce(p_reason,'')),'') is null then return jsonb_build_object('ok',false,'error','New due date and reason are required'); end if;
 select coalesce(collection_due_at,due_at) into v_old from public.loans where id=p_loan_id for update;
 if not found then return jsonb_build_object('ok',false,'error','Loan not found'); end if;
 update public.loans set due_at=p_new_due_at,collection_due_at=p_new_due_at,due_date=(p_new_due_at at time zone 'Asia/Kuala_Lumpur')::date,updated_at=now() where id=p_loan_id;
 insert into public.loan_due_date_history(loan_id,old_due_at,new_due_at,reason,change_type,changed_by) values(p_loan_id,v_old,p_new_due_at,btrim(p_reason),'manual',auth.uid());
 return jsonb_build_object('ok',true,'old_due_at',v_old,'new_due_at',p_new_due_at);
end $$;

grant execute on function public.wl_change_loan_due_at(uuid,timestamptz,text) to authenticated;

create or replace function public.wl_cancel_overdue_event(p_event_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_event public.loan_overdue_events%rowtype;
begin
 if not public.wl_is_active_staff() then return jsonb_build_object('ok',false,'error','Staff access required'); end if;
 if nullif(btrim(coalesce(p_reason,'')),'') is null then return jsonb_build_object('ok',false,'error','Cancellation reason is required'); end if;
 select * into v_event from public.loan_overdue_events where id=p_event_id and status='active' for update;
 if not found then return jsonb_build_object('ok',false,'error','Active overdue event not found'); end if;
 update public.loan_overdue_events set status='cancelled',cancelled_by=auth.uid(),cancelled_at=now(),cancel_reason=btrim(p_reason) where id=p_event_id;
 update public.loans set overdue_charge=greatest(coalesce(overdue_charge,0)-v_event.amount,0),updated_at=now() where id=v_event.loan_id;
 return jsonb_build_object('ok',true,'loan_id',v_event.loan_id,'cancelled_amount',v_event.amount);
end $$;

grant execute on function public.wl_cancel_overdue_event(uuid,text) to authenticated;

create or replace function public.wl_process_auto_overdue()
returns jsonb language plpgsql security definer set search_path=public as $$
declare r record; v_count integer:=0; v_due timestamptz; v_fee numeric;
begin
 for r in
   select l.* from public.loans l
   where l.status in ('active','ongoing','in_progress') and coalesce(l.auto_overdue_enabled,true)=true
 loop
   v_due:=coalesce(r.collection_due_at,r.due_at,case when r.due_date is not null then ((r.due_date::date+time '23:59:59') at time zone 'Asia/Kuala_Lumpur') end);
   v_fee:=coalesce(r.overdue_fee_amount,200);
   if v_due is null or v_due>=now() then continue; end if;
   if exists(select 1 from public.loan_overdue_events e where e.loan_id=r.id and e.assessed_due_at=v_due and e.source='automatic') then continue; end if;
   -- A payment submission made on or before the deadline prevents the automatic fee, even when reviewed later.
   if exists(select 1 from public.payment_submissions p where p.loan_id=r.id and p.created_at<=v_due and coalesce(p.status,'') not in ('rejected','cancelled','failed')) then continue; end if;
   insert into public.loan_overdue_events(loan_id,assessed_due_at,amount,status,source,reason) values(r.id,v_due,v_fee,'active','automatic','No payment submission before the collection deadline') on conflict do nothing;
   if found then
     update public.loans set overdue_charge=coalesce(overdue_charge,0)+v_fee,updated_at=now() where id=r.id;
     v_count:=v_count+1;
   end if;
 end loop;
 return jsonb_build_object('ok',true,'assessed',v_count,'processed_at',now());
end $$;

grant execute on function public.wl_process_auto_overdue() to authenticated;

-- Schedule every five minutes when pg_cron is available. Safe to run repeatedly.
do $$
begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
   begin perform cron.unschedule('wl-auto-overdue-v24'); exception when others then null; end;
   perform cron.schedule('wl-auto-overdue-v24','*/5 * * * *','select public.wl_process_auto_overdue();');
 end if;
exception when others then
 raise notice 'pg_cron schedule was not created. Enable pg_cron or call wl_process_auto_overdue() from a scheduled Edge Function.';
end $$;

select public.wl_process_auto_overdue();
