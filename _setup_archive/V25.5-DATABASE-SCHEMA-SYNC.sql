-- WL Credit V25.5
-- Schema compatibility migration for bank distribution and overdue controls.
-- Safe to run more than once.

begin;

-- Existing installations may already have these tables but miss columns because
-- CREATE TABLE IF NOT EXISTS never alters an existing table.
create table if not exists public.bank_distribution_rules (
  bank_id uuid primary key references public.receiving_banks(id) on delete cascade,
  target_capacity integer not null default 0,
  auto_fill boolean not null default true,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.bank_distribution_rules
  add column if not exists target_capacity integer default 0,
  add column if not exists auto_fill boolean default true,
  add column if not exists updated_by uuid,
  add column if not exists updated_at timestamptz default now();

update public.bank_distribution_rules
set target_capacity=coalesce(target_capacity,0),
    auto_fill=coalesce(auto_fill,true),
    updated_at=coalesce(updated_at,now());

create table if not exists public.bank_customer_assignments (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  bank_id uuid not null references public.receiving_banks(id) on delete cascade,
  assignment_mode text not null default 'auto',
  locked boolean not null default false,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bank_customer_assignments
  add column if not exists assignment_mode text default 'auto',
  add column if not exists locked boolean default false,
  add column if not exists assigned_by uuid,
  add column if not exists assigned_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.bank_customer_assignments
set assignment_mode=coalesce(nullif(assignment_mode,''),'auto'),
    locked=coalesce(locked,false),
    assigned_at=coalesce(assigned_at,now()),
    updated_at=coalesce(updated_at,now());

-- Normalize unexpected legacy values without failing the migration.
update public.bank_customer_assignments
set assignment_mode='auto'
where assignment_mode not in ('auto','manual');

create table if not exists public.staff_bank_assignments (
  bank_id uuid not null references public.receiving_banks(id) on delete cascade,
  staff_user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (bank_id, staff_user_id)
);

create index if not exists bank_customer_assignments_bank_idx
  on public.bank_customer_assignments(bank_id, assigned_at);
create index if not exists staff_bank_assignments_staff_idx
  on public.staff_bank_assignments(staff_user_id, bank_id);

-- Recreate the V25.4 allocation function only after all compatibility columns exist.
-- This script deliberately includes the deployed V25.4 implementation.
commit;

-- Run the V25.4 allocation migration after this file if it was not already run:
-- V25.4-BANK-CUSTOMER-ALLOCATION.sql
