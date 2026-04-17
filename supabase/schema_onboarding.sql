-- ============================================================
-- IARA — Onboarding: adiciona campo onboarding_completo
-- Execute no SQL Editor do Supabase
-- ============================================================

alter table public.creator_profiles
  add column if not exists onboarding_completo boolean default false;
