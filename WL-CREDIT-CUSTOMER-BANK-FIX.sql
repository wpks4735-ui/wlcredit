-- WL Credit: customer personal bank repair. Run this entire file once before deploying.
-- Idempotent. No company bank, assignment, loan snapshot or RLS changes.
BEGIN;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_bank_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS account_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS bank_account text;
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
DROP TRIGGER IF EXISTS trg_wl_sync_customer_personal_bank_aliases ON public.customers;
-- Fill missing canonical fields using customer-owned aliases only. Existing nonempty
-- values are retained, including conflicting historical aliases for manual review.
UPDATE public.customers SET
  bank_name = coalesce(nullif(btrim(bank_name), ''), nullif(btrim(customer_bank_name), '')),
  bank_account_name = coalesce(nullif(btrim(bank_account_name), ''), nullif(btrim(account_name), '')),
  bank_account_number = coalesce(nullif(btrim(bank_account_number), ''), nullif(btrim(account_number), ''), nullif(btrim(bank_account), ''));
UPDATE public.customers SET customer_bank_name=bank_name WHERE nullif(btrim(customer_bank_name), '') IS NULL AND bank_name IS NOT NULL;
UPDATE public.customers SET account_name=bank_account_name WHERE nullif(btrim(account_name), '') IS NULL AND bank_account_name IS NOT NULL;
UPDATE public.customers SET account_number=bank_account_number WHERE nullif(btrim(account_number), '') IS NULL AND bank_account_number IS NOT NULL;
UPDATE public.customers SET bank_account=bank_account_number WHERE nullif(btrim(bank_account), '') IS NULL AND bank_account_number IS NOT NULL;
CREATE OR REPLACE FUNCTION public.wl_sync_customer_personal_bank_aliases()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.bank_name := coalesce(nullif(btrim(NEW.bank_name), ''), nullif(btrim(NEW.customer_bank_name), ''));
  ELSE
    IF NEW.bank_name IS DISTINCT FROM OLD.bank_name THEN
      NEW.bank_name := nullif(btrim(NEW.bank_name), '');
    ELSIF NEW.customer_bank_name IS DISTINCT FROM OLD.customer_bank_name THEN
      NEW.bank_name := nullif(btrim(NEW.customer_bank_name), '');
    END IF;
  END IF;
  NEW.customer_bank_name := NEW.bank_name;
  IF TG_OP = 'INSERT' THEN
    NEW.bank_account_name := coalesce(nullif(btrim(NEW.bank_account_name), ''), nullif(btrim(NEW.account_name), ''));
  ELSE
    IF NEW.bank_account_name IS DISTINCT FROM OLD.bank_account_name THEN
      NEW.bank_account_name := nullif(btrim(NEW.bank_account_name), '');
    ELSIF NEW.account_name IS DISTINCT FROM OLD.account_name THEN
      NEW.bank_account_name := nullif(btrim(NEW.account_name), '');
    END IF;
  END IF;
  NEW.account_name := NEW.bank_account_name;
  IF TG_OP = 'INSERT' THEN
    NEW.bank_account_number := coalesce(nullif(btrim(NEW.bank_account_number), ''), nullif(btrim(NEW.account_number), ''), nullif(btrim(NEW.bank_account), ''));
  ELSE
    IF NEW.bank_account_number IS DISTINCT FROM OLD.bank_account_number THEN
      NEW.bank_account_number := nullif(btrim(NEW.bank_account_number), '');
    ELSIF NEW.account_number IS DISTINCT FROM OLD.account_number THEN
      NEW.bank_account_number := nullif(btrim(NEW.account_number), '');
    ELSIF NEW.bank_account IS DISTINCT FROM OLD.bank_account THEN
      NEW.bank_account_number := nullif(btrim(NEW.bank_account), '');
    END IF;
  END IF;
  NEW.account_number := NEW.bank_account_number;
  NEW.bank_account := NEW.bank_account_number;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_wl_sync_customer_personal_bank_aliases
BEFORE INSERT OR UPDATE OF bank_name, customer_bank_name, bank_account_name, account_name, bank_account_number, account_number, bank_account ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.wl_sync_customer_personal_bank_aliases();
NOTIFY pgrst, 'reload schema';
COMMIT;
-- Non-sensitive verification: expected 7 bank columns.
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='customers'
AND column_name IN ('bank_name','customer_bank_name','bank_account_name','account_name','bank_account_number','account_number','bank_account') ORDER BY column_name;
-- Conflicting legacy values are not silently overwritten during migration.
SELECT count(*) AS customers_with_conflicting_bank_aliases FROM public.customers WHERE
(nullif(btrim(bank_name),'') IS NOT NULL AND nullif(btrim(customer_bank_name),'') IS NOT NULL AND btrim(bank_name) <> btrim(customer_bank_name))
OR (nullif(btrim(bank_account_name),'') IS NOT NULL AND nullif(btrim(account_name),'') IS NOT NULL AND btrim(bank_account_name) <> btrim(account_name))
OR (nullif(btrim(bank_account_number),'') IS NOT NULL AND nullif(btrim(account_number),'') IS NOT NULL AND btrim(bank_account_number) <> btrim(account_number))
OR (nullif(btrim(bank_account_number),'') IS NOT NULL AND nullif(btrim(bank_account),'') IS NOT NULL AND btrim(bank_account_number) <> btrim(bank_account));
