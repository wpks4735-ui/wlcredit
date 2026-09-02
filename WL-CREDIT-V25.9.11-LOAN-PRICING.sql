-- WL Credit V25.9.11: persist loan pricing breakdown.
begin;
alter table public.loan_applications
 add column if not exists interest_rate numeric(8,4),
 add column if not exists processing_fee numeric(14,2) not null default 0,
 add column if not exists net_disbursement_amount numeric(14,2);
alter table public.loans
 add column if not exists interest_rate numeric(8,4),
 add column if not exists processing_fee numeric(14,2) not null default 0,
 add column if not exists net_disbursement_amount numeric(14,2);
alter table public.loan_applications drop constraint if exists loan_applications_interest_rate_check;
alter table public.loan_applications add constraint loan_applications_interest_rate_check check(interest_rate is null or interest_rate between 0 and 100);
alter table public.loan_applications drop constraint if exists loan_applications_processing_fee_check;
alter table public.loan_applications add constraint loan_applications_processing_fee_check check(processing_fee>=0);
alter table public.loans drop constraint if exists loans_interest_rate_check;
alter table public.loans add constraint loans_interest_rate_check check(interest_rate is null or interest_rate between 0 and 100);
alter table public.loans drop constraint if exists loans_processing_fee_check;
alter table public.loans add constraint loans_processing_fee_check check(processing_fee>=0);

create or replace function public.wl_sync_loan_pricing_from_application()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_loan uuid;
begin
 target_loan=coalesce(new.loan_id,new.created_loan_id);
 if target_loan is not null then
  update public.loans set
   interest_rate=new.interest_rate,
   processing_fee=coalesce(new.processing_fee,0),
   net_disbursement_amount=coalesce(new.net_disbursement_amount,new.approved_principal)
  where id=target_loan;
 end if;
 return new;
end $$;
drop trigger if exists wl_sync_loan_pricing_from_application on public.loan_applications;
create trigger wl_sync_loan_pricing_from_application after insert or update of loan_id,created_loan_id,interest_rate,processing_fee,net_disbursement_amount on public.loan_applications for each row execute function public.wl_sync_loan_pricing_from_application();
commit;
