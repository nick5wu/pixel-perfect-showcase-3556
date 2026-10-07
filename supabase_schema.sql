-- ==============================================================================
-- UsTwo Ledger (我們倆的記帳小窩) - Supabase 雲端資料庫架構腳本
-- 請將此腳本完整複製並貼上至 Supabase Dashboard -> SQL Editor 執行
-- ==============================================================================

-- 1. 小窩帳本主表 (couples)
create table if not exists public.couples (
  id text primary key default gen_random_uuid()::text,
  couple_code text unique not null,
  name text not null default '我們倆的記帳小窩',
  anniversary text not null default '2021-10-16',
  budget numeric not null default 0,
  people jsonb not null default '{"me":{"name":"Me","zh":"我","emoji":"🐻","color":"var(--mine)"},"her":{"name":"Her","zh":"她","emoji":"🐰","color":"var(--hers)"}}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2. 記帳交易記錄表 (transactions)
create table if not exists public.transactions (
  id text primary key,
  couple_id text not null references public.couples(id) on delete cascade,
  date text not null,
  amount numeric not null,
  kind text not null check (kind in ('expense', 'income')),
  category text not null,
  note text not null default '',
  payer text not null check (payer in ('me', 'her')),
  is_private boolean not null default false,
  for_partner_amount numeric not null default 0,
  photo text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 若已存在 transactions 表，可單獨執行此行升級：
alter table if exists public.transactions add column if not exists for_partner_amount numeric not null default 0;

-- 建立高效索引 (依小窩與日期快速查詢)
create index if not exists idx_txns_couple_date on public.transactions(couple_id, date desc);
create index if not exists idx_txns_privacy on public.transactions(couple_id, is_private, payer);
create index if not exists idx_couples_code on public.couples(couple_code);

-- 3. 夢想撲滿存錢筒表 (goals)
create table if not exists public.goals (
  id text primary key,
  couple_id text not null references public.couples(id) on delete cascade,
  title text not null,
  zh text not null,
  icon text not null default 'sparkles',
  tint text not null default 'var(--cat-1)',
  target numeric not null default 0,
  saved numeric not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_goals_couple on public.goals(couple_id);

-- 4. 自訂分類表 (categories)
create table if not exists public.categories (
  id text primary key,
  couple_id text not null references public.couples(id) on delete cascade,
  zh text not null,
  kind text not null check (kind in ('expense', 'income')),
  icon text not null,
  tint text not null,
  custom boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. 啟用 Supabase Realtime (即時雙向推播)
-- 讓兩人無論身在何處，只要一方記帳，另一方的畫面立刻無感即時刷新！
begin;
  -- 若表格尚未加入 realtime publication，則加入
  alter publication supabase_realtime add table public.couples;
  alter publication supabase_realtime add table public.transactions;
  alter publication supabase_realtime add table public.goals;
commit;

-- 6. 設定 Row Level Security (RLS)
alter table public.couples enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.categories enable row level security;

-- 允許已持有 couple_code 或 anon key 的客戶端進行讀寫
create policy "Allow all access to couples" on public.couples for all using (true) with check (true);
create policy "Allow all access to transactions" on public.transactions for all using (true) with check (true);
create policy "Allow all access to goals" on public.goals for all using (true) with check (true);
create policy "Allow all access to categories" on public.categories for all using (true) with check (true);

-- 7. 建立收據照片儲存桶 (Storage bucket: receipts)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

-- 允許任何人讀取收據照片，以及公開上傳
create policy "Allow public read receipts" on storage.objects
for select using (bucket_id = 'receipts');

create policy "Allow public insert receipts" on storage.objects
for insert with check (bucket_id = 'receipts');

create policy "Allow public update receipts" on storage.objects
for update using (bucket_id = 'receipts');

-- 8. 預設測試小窩（選填，方便立即體驗）
insert into public.couples (id, couple_code, name, anniversary, budget)
values ('demo-couple-id', 'LOVE520', '我們倆的記帳小窩', '2021-10-16', 25000)
on conflict (couple_code) do nothing;
