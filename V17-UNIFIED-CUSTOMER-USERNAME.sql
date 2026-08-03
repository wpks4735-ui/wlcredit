-- WL Credit V17
-- Canonical customer identity:
--   customers.username = customers.customer_code = portal login username (WL001, WL002, ...)
-- The UUID `id` remains internal and must not be shown to customers.
-- Safe to run after V16.4; this migration is idempotent.

begin;

alter table public.customers
  add column if not exists username text;

create sequence if not exists public.customer_username_seq
  start with 1 increment by 1;

-- Normalize existing WL identities and copy them into the canonical username field.
update public.customers
set customer_code = upper(btrim(customer_code))
where customer_code is not null;

update public.customers
set username = customer_code
where customer_code ~ '^WL[0-9]+$'
  and username is distinct from customer_code;

-- Assign a WL username to any legacy row that still has no valid identity.
do $$
declare
  r record;
  next_name text;
begin
  for r in
    select id
    from public.customers
    where coalesce(username, '') !~ '^WL[0-9]+$'
       or coalesce(customer_code, '') !~ '^WL[0-9]+$'
    order by created_at nulls last, id
  loop
    loop
      next_name := 'WL' || lpad(nextval('public.customer_username_seq')::text, 3, '0');
      exit when not exists (
        select 1 from public.customers
        where upper(coalesce(username, '')) = next_name
           or upper(coalesce(customer_code, '')) = next_name
      );
    end loop;
    update public.customers
       set username = next_name,
           customer_code = next_name
     where id = r.id;
  end loop;
end $$;

-- Move the sequence beyond the greatest existing WL number.
select setval(
  'public.customer_username_seq',
  greatest(
    coalesce((
      select max((substring(coalesce(username, customer_code) from '[0-9]+$'))::bigint)
      from public.customers
      where coalesce(username, customer_code) ~ '^WL[0-9]+$'
    ), 0),
    1
  ),
  true
);

create or replace function public.assign_wl_customer_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  -- On update, allow either alias to be changed; keep both columns synchronized.
  if tg_op = 'UPDATE' and new.username is distinct from old.username then
    candidate := upper(btrim(coalesce(new.username, '')));
  elsif tg_op = 'UPDATE' and new.customer_code is distinct from old.customer_code then
    candidate := upper(btrim(coalesce(new.customer_code, '')));
  else
    candidate := upper(btrim(coalesce(new.username, new.customer_code, '')));
  end if;

  if candidate !~ '^WL[0-9]+$' then
    loop
      candidate := 'WL' || lpad(nextval('public.customer_username_seq')::text, 3, '0');
      exit when not exists (
        select 1
        from public.customers c
        where c.id is distinct from new.id
          and (upper(coalesce(c.username, '')) = candidate
            or upper(coalesce(c.customer_code, '')) = candidate)
      );
    end loop;
  end if;

  new.username := candidate;
  new.customer_code := candidate; -- compatibility alias for existing RPCs
  return new;
end;
$$;

drop trigger if exists trg_assign_wl_customer_username on public.customers;
drop trigger if exists trg_assign_wl_customer_identity on public.customers;
create trigger trg_assign_wl_customer_identity
before insert or update of username, customer_code
on public.customers
for each row execute function public.assign_wl_customer_identity();

create unique index if not exists customers_username_unique
  on public.customers (upper(username));
create unique index if not exists customers_customer_code_unique
  on public.customers (upper(customer_code));

alter table public.customers
  alter column username set not null;

commit;

-- Verification:
-- select username, customer_code, full_name, phone, id_number, is_active
-- from public.customers
-- order by substring(username from '[0-9]+$')::int;
