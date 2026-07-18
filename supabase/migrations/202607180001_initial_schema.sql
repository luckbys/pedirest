-- PediRest MVP — schema multiestabelecimento com auditoria e idempotência
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'waiter', 'production', 'cashier');
create type public.tab_status as enum ('open', 'closed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'refunded');
create type public.order_status as enum ('sent', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled');

create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  phone text,
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'waiter',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  number integer not null check (number > 0),
  name text,
  seats integer not null default 4 check (seats > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, number)
);

create table public.production_sectors (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (establishment_id, name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  icon text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  production_sector_id uuid not null references public.production_sectors(id),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  preparation_time integer not null default 1 check (preparation_time >= 0),
  available boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tabs (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id),
  number text not null,
  customer_name text,
  status public.tab_status not null default 'open',
  opened_by uuid not null references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, number)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id),
  tab_id uuid not null references public.tabs(id),
  waiter_id uuid not null references public.profiles(id),
  idempotency_key uuid not null,
  display_number bigint generated always as identity,
  status public.order_status not null default 'sent',
  priority smallint not null default 0 check (priority between 0 and 2),
  notes text,
  sent_at timestamptz not null default now(),
  accepted_at timestamptz,
  preparation_started_at timestamptz,
  ready_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, idempotency_key)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid not null references public.products(id),
  production_sector_id uuid not null references public.production_sectors(id),
  quantity numeric(10,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) generated always as (quantity * unit_price) stored,
  notes text,
  status public.order_status not null default 'sent',
  preparation_started_at timestamptz,
  ready_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  order_item_id uuid references public.order_items(id) on delete restrict,
  previous_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid not null references public.profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  tab_id uuid not null references public.tabs(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('pix', 'credit', 'debit', 'cash', 'other')),
  status public.payment_status not null default 'paid',
  received_by uuid not null references public.profiles(id),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index orders_queue_idx on public.orders (establishment_id, status, sent_at);
create index orders_tab_idx on public.orders (tab_id, created_at desc);
create index order_items_sector_idx on public.order_items (production_sector_id, status, created_at);
create index notifications_user_idx on public.notifications (user_id, read, created_at desc);

create or replace function public.current_establishment_id()
returns uuid language sql stable security definer set search_path = public
as $$ select establishment_id from public.profiles where id = auth.uid() and active = true $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and active = true) $$;

alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.production_sectors enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.tabs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

create policy establishment_read on public.establishments for select using (id = public.current_establishment_id());
create policy profiles_tenant_read on public.profiles for select using (establishment_id = public.current_establishment_id());
create policy profiles_admin_write on public.profiles for all using (establishment_id = public.current_establishment_id() and public.is_admin()) with check (establishment_id = public.current_establishment_id() and public.is_admin());

do $$
declare table_name text;
begin
  foreach table_name in array array['restaurant_tables','production_sectors','categories','products','tabs','orders','order_status_history','payments','notifications']
  loop
    execute format('create policy %I on public.%I for select using (establishment_id = public.current_establishment_id())', table_name || '_tenant_read', table_name);
    execute format('create policy %I on public.%I for insert with check (establishment_id = public.current_establishment_id())', table_name || '_tenant_insert', table_name);
    execute format('create policy %I on public.%I for update using (establishment_id = public.current_establishment_id()) with check (establishment_id = public.current_establishment_id())', table_name || '_tenant_update', table_name);
  end loop;
end $$;

create policy order_items_tenant_read on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.establishment_id = public.current_establishment_id())
);
create policy order_items_tenant_insert on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.establishment_id = public.current_establishment_id())
);
create policy order_items_tenant_update on public.order_items for update using (
  exists (select 1 from public.orders o where o.id = order_id and o.establishment_id = public.current_establishment_id())
);

-- Pedidos enviados não possuem policy de DELETE: cancelamento é sempre lógico e auditável.

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger touch_products before update on public.products for each row execute function public.touch_updated_at();
create trigger touch_tabs before update on public.tabs for each row execute function public.touch_updated_at();
create trigger touch_orders before update on public.orders for each row execute function public.touch_updated_at();
create trigger touch_order_items before update on public.order_items for each row execute function public.touch_updated_at();

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.notifications;
