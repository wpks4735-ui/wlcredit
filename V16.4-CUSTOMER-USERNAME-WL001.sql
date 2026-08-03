-- WL Credit V16.4
-- Unify customer number and portal username as WL001, WL002, WL003...
-- IMPORTANT: Running this migration changes existing customers' login usernames.

begin;

-- Keep a dedicated sequence for future customer usernames.
create sequence if not exists public.customer_username_seq start with 1 increment by 1;

-- Temporarily move existing values out of the WL number range to avoid unique collisions.
update public.customers
set customer_code = 'TMP-' || id::text
where customer_code is distinct from ('TMP-' || id::text);

-- Renumber all existing customers deterministically by creation time.
with numbered as (
  select id,
         row_number() over (order by created_at nulls last, id) as rn
  from public.customers
)
update public.customers c
set customer_code = 'WL' || lpad(numbered.rn::text, 3, '0')
from numbered
where numbered.id = c.id;

-- Continue after the current highest number.
select setval(
  'public.customer_username_seq',
  greatest((select count(*) from public.customers), 1),
  true
);

create or replace function public.assign_wl_customer_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_code is null
     or btrim(new.customer_code) = ''
     or new.customer_code !~ '^WL[0-9]+$' then
    new.customer_code := 'WL' || lpad(nextval('public.customer_username_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_wl_customer_username on public.customers;
create trigger trg_assign_wl_customer_username
before insert on public.customers
for each row execute function public.assign_wl_customer_username();

-- Prevent duplicate portal usernames.
create unique index if not exists customers_customer_code_unique
on public.customers(customer_code);

commit;

-- Verification:
-- select customer_code, full_name, phone, id_number, is_active
-- from public.customers
-- order by customer_code;
