-- WL Credit V24.3 compatibility patch
-- Fixes legacy RPCs/triggers that expect customer bank fields such as c.bank_name.
-- Run once in Supabase SQL Editor before testing New Loan.

begin;

alter table public.customers add column if not exists bank_name text;
alter table public.customers add column if not exists bank_account_name text;
alter table public.customers add column if not exists bank_account_number text;

-- Copy existing customer bank data from commonly used legacy columns when available.
do $$
begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='customers' and column_name='customer_bank_name') then
    execute 'update public.customers set bank_name=coalesce(bank_name,customer_bank_name) where bank_name is null';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='customers' and column_name='account_name') then
    execute 'update public.customers set bank_account_name=coalesce(bank_account_name,account_name) where bank_account_name is null';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='customers' and column_name='account_number') then
    execute 'update public.customers set bank_account_number=coalesce(bank_account_number,account_number) where bank_account_number is null';
  end if;
end $$;

commit;

-- Verification
select column_name
from information_schema.columns
where table_schema='public' and table_name='customers'
  and column_name in ('bank_name','bank_account_name','bank_account_number')
order by column_name;
