begin;

alter table if exists public.loan_applications
  add column if not exists rejection_stage text,
  add column if not exists rejected_from_status text,
  add column if not exists rejected_by uuid,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text;

alter table if exists public.payment_submissions
  add column if not exists rejection_stage text,
  add column if not exists rejected_from_status text,
  add column if not exists rejected_by uuid,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text;

alter table if exists public.salary_advances
  add column if not exists rejection_reason text,
  add column if not exists rejected_by uuid,
  add column if not exists rejected_at timestamptz;

create table if not exists public.workflow_rejection_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  stage text not null,
  previous_status text,
  next_status text,
  reason text not null,
  rejected_by uuid,
  rejected_at timestamptz not null default now()
);

alter table public.workflow_rejection_logs enable row level security;

drop policy if exists workflow_rejection_logs_staff_read on public.workflow_rejection_logs;
create policy workflow_rejection_logs_staff_read on public.workflow_rejection_logs
for select to authenticated using (true);

drop policy if exists workflow_rejection_logs_staff_insert on public.workflow_rejection_logs;
create policy workflow_rejection_logs_staff_insert on public.workflow_rejection_logs
for insert to authenticated with check (true);

create or replace function public.wl_reject_loan_workflow_v233(
  p_application_id uuid,
  p_stage text,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_next text;
begin
  if nullif(trim(p_reason),'') is null then
    return jsonb_build_object('ok',false,'error','Rejection reason is required');
  end if;

  select status into v_old from public.loan_applications where id=p_application_id for update;
  if v_old is null then return jsonb_build_object('ok',false,'error','Application not found'); end if;

  if p_stage='finance_disbursement' then
    v_next := 'under_review';
  else
    v_next := 'rejected';
  end if;

  update public.loan_applications set
    status=v_next,
    rejection_stage=p_stage,
    rejected_from_status=v_old,
    rejection_reason=trim(p_reason),
    rejected_by=auth.uid(),
    rejected_at=now(),
    updated_at=now()
  where id=p_application_id;

  insert into public.workflow_rejection_logs(entity_type,entity_id,stage,previous_status,next_status,reason,rejected_by)
  values('loan_application',p_application_id,p_stage,v_old,v_next,trim(p_reason),auth.uid());

  return jsonb_build_object('ok',true,'previous_status',v_old,'status',v_next);
end $$;

grant execute on function public.wl_reject_loan_workflow_v233(uuid,text,text) to authenticated;

create or replace function public.wl_reject_payment_workflow_v233(
  p_submission_id uuid,
  p_stage text,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_next text;
  v_finance text;
begin
  if nullif(trim(p_reason),'') is null then
    return jsonb_build_object('ok',false,'error','Rejection reason is required');
  end if;

  select status into v_old from public.payment_submissions where id=p_submission_id for update;
  if v_old is null then return jsonb_build_object('ok',false,'error','Payment submission not found'); end if;

  if p_stage='staff_posting' then
    v_next := 'pending_finance';
    v_finance := 'pending_finance';
  else
    v_next := 'rejected';
    v_finance := 'rejected';
  end if;

  update public.payment_submissions set
    status=v_next,
    finance_status=v_finance,
    rejection_stage=p_stage,
    rejected_from_status=v_old,
    rejection_reason=trim(p_reason),
    rejected_by=auth.uid(),
    rejected_at=now(),
    updated_at=now()
  where id=p_submission_id;

  insert into public.workflow_rejection_logs(entity_type,entity_id,stage,previous_status,next_status,reason,rejected_by)
  values('payment_submission',p_submission_id,p_stage,v_old,v_next,trim(p_reason),auth.uid());

  return jsonb_build_object('ok',true,'previous_status',v_old,'status',v_next);
end $$;

grant execute on function public.wl_reject_payment_workflow_v233(uuid,text,text) to authenticated;

create or replace function public.wl_reject_salary_advance_v233(
  p_advance_id uuid,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_old text;
begin
  if nullif(trim(p_reason),'') is null then
    return jsonb_build_object('ok',false,'error','Rejection reason is required');
  end if;
  select status into v_old from public.salary_advances where id=p_advance_id for update;
  if v_old is null then return jsonb_build_object('ok',false,'error','Salary advance not found'); end if;
  update public.salary_advances set status='rejected',rejection_reason=trim(p_reason),rejected_by=auth.uid(),rejected_at=now(),updated_at=now() where id=p_advance_id;
  insert into public.workflow_rejection_logs(entity_type,entity_id,stage,previous_status,next_status,reason,rejected_by)
  values('salary_advance',p_advance_id,'salary_advance',v_old,'rejected',trim(p_reason),auth.uid());
  return jsonb_build_object('ok',true);
end $$;

grant execute on function public.wl_reject_salary_advance_v233(uuid,text) to authenticated;

commit;
