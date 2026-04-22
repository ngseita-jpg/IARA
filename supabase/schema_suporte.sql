-- ═══════════════════════════════════════════════════════════════
-- SCHEMA: Suporte / SAC
-- ═══════════════════════════════════════════════════════════════

create table if not exists suporte_tickets (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  nome text,
  categoria text not null default 'outro' check (
    categoria in ('conta', 'pagamento', 'modulo', 'bug', 'sugestao', 'outro')
  ),
  assunto text not null,
  mensagem text not null,
  status text not null default 'aberto' check (
    status in ('aberto', 'em_andamento', 'respondido', 'fechado')
  ),
  resposta_admin text,
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists idx_suporte_tickets_user on suporte_tickets(user_id);
create index if not exists idx_suporte_tickets_status on suporte_tickets(status);
create index if not exists idx_suporte_tickets_created on suporte_tickets(created_at desc);

alter table suporte_tickets enable row level security;

-- Usuário autenticado vê só seus tickets
drop policy if exists "users can see own tickets" on suporte_tickets;
create policy "users can see own tickets" on suporte_tickets
  for select using (auth.uid() = user_id);

-- Usuário pode criar ticket próprio (user_id = seu ou null pra guest)
drop policy if exists "users can create tickets" on suporte_tickets;
create policy "users can create tickets" on suporte_tickets
  for insert with check (auth.uid() = user_id or user_id is null);

-- ═══════════════════════════════════════════════════════════════
-- CHAT DE SUPORTE COM IA (histórico por sessão)
-- ═══════════════════════════════════════════════════════════════

create table if not exists suporte_chat_mensagens (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  sessao_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_suporte_chat_sessao on suporte_chat_mensagens(sessao_id, created_at);
create index if not exists idx_suporte_chat_user on suporte_chat_mensagens(user_id, created_at desc);

alter table suporte_chat_mensagens enable row level security;

drop policy if exists "users can see own chat" on suporte_chat_mensagens;
create policy "users can see own chat" on suporte_chat_mensagens
  for select using (auth.uid() = user_id);

drop policy if exists "users can insert own chat" on suporte_chat_mensagens;
create policy "users can insert own chat" on suporte_chat_mensagens
  for insert with check (auth.uid() = user_id or user_id is null);
