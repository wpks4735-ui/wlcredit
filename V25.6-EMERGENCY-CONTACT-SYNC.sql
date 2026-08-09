begin;

-- Keep the two emergency contacts on the customer record itself.
alter table public.customers add column if not exists emergency_name text;
alter table public.customers add column if not exists emergency_relation text;
alter table public.customers add column if not exists emergency_phone text;
alter table public.customers add column if not exists emergency_name_2 text;
alter table public.customers add column if not exists emergency_relation_2 text;
alter table public.customers add column if not exists emergency_phone_2 text;

-- Backfill existing customers from their linked application.  Existing customer
-- values win; application values only fill blanks.
with ranked as (
  select la.*,
         row_number() over (
           partition by la.customer_id
           order by la.created_at desc nulls last, la.id desc
         ) as rn
  from public.loan_applications la
  where la.customer_id is not null
)
update public.customers c
set emergency_name       = coalesce(nullif(c.emergency_name,''),       nullif(r.emergency_name,'')),
    emergency_relation   = coalesce(nullif(c.emergency_relation,''),   nullif(r.emergency_relation,'')),
    emergency_phone      = coalesce(nullif(c.emergency_phone,''),      nullif(r.emergency_phone,'')),
    emergency_name_2     = coalesce(nullif(c.emergency_name_2,''),     nullif(r.emergency_name_2,'')),
    emergency_relation_2 = coalesce(nullif(c.emergency_relation_2,''), nullif(r.emergency_relation_2,'')),
    emergency_phone_2    = coalesce(nullif(c.emergency_phone_2,''),    nullif(r.emergency_phone_2,'')),
    updated_at            = now()
from ranked r
where r.rn=1 and r.customer_id=c.id
  and (
    coalesce(c.emergency_name,'')='' or coalesce(c.emergency_relation,'')='' or coalesce(c.emergency_phone,'')='' or
    coalesce(c.emergency_name_2,'')='' or coalesce(c.emergency_relation_2,'')='' or coalesce(c.emergency_phone_2,'')=''
  );

-- Whenever an application becomes linked to a customer (normally on approval),
-- copy its emergency contacts into the customer record without overwriting
-- already-maintained customer values with blanks.
create or replace function public.wl_sync_application_emergency_contacts()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.customer_id is not null then
    update public.customers c
       set emergency_name       = coalesce(nullif(new.emergency_name,''),       c.emergency_name),
           emergency_relation   = coalesce(nullif(new.emergency_relation,''),   c.emergency_relation),
           emergency_phone      = coalesce(nullif(new.emergency_phone,''),      c.emergency_phone),
           emergency_name_2     = coalesce(nullif(new.emergency_name_2,''),     c.emergency_name_2),
           emergency_relation_2 = coalesce(nullif(new.emergency_relation_2,''), c.emergency_relation_2),
           emergency_phone_2    = coalesce(nullif(new.emergency_phone_2,''),    c.emergency_phone_2),
           updated_at            = now()
     where c.id=new.customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wl_sync_application_emergency_contacts on public.loan_applications;
create trigger trg_wl_sync_application_emergency_contacts
after insert or update of customer_id, emergency_name, emergency_relation, emergency_phone,
                         emergency_name_2, emergency_relation_2, emergency_phone_2
on public.loan_applications
for each row execute function public.wl_sync_application_emergency_contacts();

commit;
