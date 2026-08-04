-- WL Credit V24.4: personal customer bank details stored at customer level
begin;
alter table public.customers add column if not exists bank_name text;
alter table public.customers add column if not exists bank_account_name text;
alter table public.customers add column if not exists bank_account_number text;
commit;
