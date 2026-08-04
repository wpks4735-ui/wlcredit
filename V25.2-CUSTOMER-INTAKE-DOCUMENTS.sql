begin;

alter table public.loan_applications add column if not exists employer_phone text;
alter table public.loan_applications add column if not exists employer_pic_name text;
alter table public.loan_applications add column if not exists employer_pic_phone text;

alter table public.customers add column if not exists occupation text;
alter table public.customers add column if not exists employer text;
alter table public.customers add column if not exists monthly_salary numeric;
alter table public.customers add column if not exists salary_frequency text;
alter table public.customers add column if not exists employer_phone text;
alter table public.customers add column if not exists employer_pic_name text;
alter table public.customers add column if not exists employer_pic_phone text;
alter table public.customers add column if not exists bank_name text;
alter table public.customers add column if not exists bank_account_name text;
alter table public.customers add column if not exists bank_account_number text;
alter table public.customers add column if not exists emergency_name text;
alter table public.customers add column if not exists emergency_relation text;
alter table public.customers add column if not exists emergency_phone text;
alter table public.customers add column if not exists emergency_name_2 text;
alter table public.customers add column if not exists emergency_relation_2 text;
alter table public.customers add column if not exists emergency_phone_2 text;

create or replace function public.public_save_application_extra(
  p_application_code text,
  p_employer_phone text default null,
  p_employer_pic_name text default null,
  p_employer_pic_phone text default null,
  p_document_paths jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  update public.loan_applications
     set employer_phone=nullif(trim(p_employer_phone),''),
         employer_pic_name=nullif(trim(p_employer_pic_name),''),
         employer_pic_phone=nullif(trim(p_employer_pic_phone),''),
         document_paths=coalesce(document_paths,'{}'::jsonb) || coalesce(p_document_paths,'{}'::jsonb)
   where application_code=p_application_code
   returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','Application not found'); end if;
  return jsonb_build_object('ok',true,'application_id',v_id);
end $$;

grant execute on function public.public_save_application_extra(text,text,text,text,jsonb) to anon, authenticated;

commit;
