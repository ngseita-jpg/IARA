-- ============================================================
-- IARA — Banco de Fotos do Usuário (bucket PRIVADO)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tabela de metadados das fotos
create table if not exists public.user_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  nome         text,
  tamanho_kb   int,
  created_at   timestamptz default now()
);

alter table public.user_photos enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_photos' and policyname = 'Users can manage own photos') then
    create policy "Users can manage own photos" on public.user_photos
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- STORAGE: bucket PRIVADO — apenas o dono acessa as próprias fotos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('fotos-usuario', 'fotos-usuario', false)  -- false = privado
on conflict (id) do update set public = false;    -- garante que é privado mesmo se já existia

-- Policy: upload apenas na própria pasta (userId/arquivo)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'fotos-usuario: users upload own'
  ) then
    create policy "fotos-usuario: users upload own"
      on storage.objects for insert
      with check (
        bucket_id = 'fotos-usuario'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Policy: leitura apenas na própria pasta (URLs assinadas geradas pelo servidor)
do $$ begin
  -- remove a policy pública anterior se existir
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'fotos-usuario: public read'
  ) then
    drop policy "fotos-usuario: public read" on storage.objects;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'fotos-usuario: users read own'
  ) then
    create policy "fotos-usuario: users read own"
      on storage.objects for select
      using (
        bucket_id = 'fotos-usuario'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Policy: delete apenas da própria pasta
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'fotos-usuario: users delete own'
  ) then
    create policy "fotos-usuario: users delete own"
      on storage.objects for delete
      using (
        bucket_id = 'fotos-usuario'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
