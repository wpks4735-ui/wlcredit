begin;

alter table public.loan_applications
  add column if not exists finance_proof_path text,
  add column if not exists finance_proof_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'disbursement-proofs',
  'disbursement-proofs',
  false,
  10485760,
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated staff can upload and read proof files. Backend role checks still
-- control who can reach the finance workflow in the application UI.
drop policy if exists "staff upload disbursement proofs" on storage.objects;
create policy "staff upload disbursement proofs"
on storage.objects for insert to authenticated
with check (bucket_id = 'disbursement-proofs');

drop policy if exists "staff read disbursement proofs" on storage.objects;
create policy "staff read disbursement proofs"
on storage.objects for select to authenticated
using (bucket_id = 'disbursement-proofs');

commit;
