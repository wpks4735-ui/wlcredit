-- WL Credit V25: existing customer multi-loan idempotency support
begin;

alter table if exists public.loan_applications
  add column if not exists created_loan_id uuid;

create index if not exists loan_applications_created_loan_id_idx
  on public.loan_applications(created_loan_id);

-- Prevent one application from linking to more than one created loan.
create unique index if not exists loan_applications_created_loan_id_unique
  on public.loan_applications(created_loan_id)
  where created_loan_id is not null;

commit;
