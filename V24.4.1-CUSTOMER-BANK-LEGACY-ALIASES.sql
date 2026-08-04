-- WL Credit V24.4.1
-- Customer personal-bank compatibility aliases.
-- Fixes legacy RPC/trigger records that read c.account_name / c.account_number
-- while newer pages save bank_account_name / bank_account_number.

begin;

alter table public.customers add column if not exists bank_name text;
alter table public.customers add column if not exists bank_account_name text;
alter table public.customers add column if not exists bank_account_number text;
alter table public.customers add column if not exists account_name text;
alter table public.customers add column if not exists account_number text;
alter table public.customers add column if not exists bank_account text;

-- Backfill both the current and legacy column names.
update public.customers
set
  bank_account_name = coalesce(nullif(bank_account_name, ''), nullif(account_name, '')),
  account_name      = coalesce(nullif(account_name, ''), nullif(bank_account_name, '')),
  bank_account_number = coalesce(nullif(bank_account_number, ''), nullif(account_number, ''), nullif(bank_account, '')),
  account_number      = coalesce(nullif(account_number, ''), nullif(bank_account_number, ''), nullif(bank_account, '')),
  bank_account        = coalesce(nullif(bank_account, ''), nullif(bank_account_number, ''), nullif(account_number, ''));

create or replace function public.wl_sync_customer_personal_bank_aliases()
returns trigger
language plpgsql
as $$
begin
  -- Account holder name: keep current and legacy names synchronized.
  if new.bank_account_name is distinct from old.bank_account_name then
    new.account_name := new.bank_account_name;
  elsif new.account_name is distinct from old.account_name then
    new.bank_account_name := new.account_name;
  else
    new.bank_account_name := coalesce(nullif(new.bank_account_name, ''), nullif(new.account_name, ''));
    new.account_name := coalesce(nullif(new.account_name, ''), nullif(new.bank_account_name, ''));
  end if;

  -- Account number: keep all historical names synchronized.
  if new.bank_account_number is distinct from old.bank_account_number then
    new.account_number := new.bank_account_number;
    new.bank_account := new.bank_account_number;
  elsif new.account_number is distinct from old.account_number then
    new.bank_account_number := new.account_number;
    new.bank_account := new.account_number;
  elsif new.bank_account is distinct from old.bank_account then
    new.bank_account_number := new.bank_account;
    new.account_number := new.bank_account;
  else
    new.bank_account_number := coalesce(nullif(new.bank_account_number, ''), nullif(new.account_number, ''), nullif(new.bank_account, ''));
    new.account_number := coalesce(nullif(new.account_number, ''), nullif(new.bank_account_number, ''), nullif(new.bank_account, ''));
    new.bank_account := coalesce(nullif(new.bank_account, ''), nullif(new.bank_account_number, ''), nullif(new.account_number, ''));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_wl_sync_customer_personal_bank_aliases on public.customers;
create trigger trg_wl_sync_customer_personal_bank_aliases
before insert or update of bank_account_name, bank_account_number, account_name, account_number, bank_account
on public.customers
for each row
execute function public.wl_sync_customer_personal_bank_aliases();

commit;

-- Verification: all six compatibility columns should be listed.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'customers'
  and column_name in (
    'bank_name',
    'bank_account_name',
    'bank_account_number',
    'account_name',
    'account_number',
    'bank_account'
  )
order by column_name;
