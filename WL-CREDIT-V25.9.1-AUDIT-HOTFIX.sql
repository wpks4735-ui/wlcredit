-- WL Credit V25.9.1 hotfix
-- Fixes: column "details" is of type jsonb but expression is of type text
-- Safe to run after the V25.9 unified upgrade. No rollback is required.
begin;

create or replace function public.wl_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  o jsonb;
  n jsonb;
  d jsonb;
  eid text;
begin
  o=case when tg_op='INSERT' then null else to_jsonb(old) end;
  n=case when tg_op='DELETE' then null else to_jsonb(new) end;
  d=case when tg_op='UPDATE' then public.wl_jsonb_diff(o,n) else coalesce(n,o) end;
  if tg_op='UPDATE' and d='{}'::jsonb then return new; end if;
  eid=coalesce(n->>'id',o->>'id',n->>'customer_id',o->>'customer_id');
  insert into public.audit_logs(action,entity_type,entity_id,staff_user_id,details,old_values,new_values,changed_fields)
  values(
    lower(tg_op)||'_'||tg_table_name,
    tg_table_name,
    eid,
    auth.uid(),
    jsonb_build_object('operation',tg_op,'changed_fields',coalesce(d,'{}'::jsonb)),
    o,n,d
  );
  return case when tg_op='DELETE' then old else new end;
end
$$;

commit;
