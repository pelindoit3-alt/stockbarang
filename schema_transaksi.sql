-- ============================================================
-- SCHEMA TRANSAKSI - Barang Masuk, Barang Keluar, Permintaan
-- Jalankan SETELAH schema_barang.sql
-- ============================================================

-- 1. TABEL PERMINTAAN BARANG (dibuat dulu karena direferensi barang_keluar)
-- ============================================================
create table public.permintaan_barang (
  id uuid default gen_random_uuid() primary key,
  nomor text not null unique,
  tanggal timestamp with time zone default timezone('utc', now()) not null,
  pemohon_id uuid references auth.users(id) on delete set null,
  pemohon_nama text not null default '',
  barang_id uuid references public.barang(id) on delete restrict not null,
  jumlah integer not null check (jumlah > 0),
  keperluan text not null default '',
  keterangan text default '',
  status text not null default 'PENDING'
    check (status in ('PENDING','APPROVED','PROCESSING','COMPLETED','REJECTED','CANCELLED')),
  alasan_penolakan text default '',
  approved_by uuid references auth.users(id) on delete set null,
  approved_by_name text default '',
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.permintaan_barang enable row level security;

create policy "permintaan viewable by authenticated" on public.permintaan_barang
  for select using (auth.role() = 'authenticated');

create policy "permintaan insert by authenticated" on public.permintaan_barang
  for insert with check (auth.role() = 'authenticated');

create policy "permintaan managed by admin" on public.permintaan_barang
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('superadmin','admin')
  );

create policy "permintaan update own pending" on public.permintaan_barang
  for update using (pemohon_id = auth.uid() and status = 'PENDING');

create policy "permintaan delete own pending" on public.permintaan_barang
  for delete using (pemohon_id = auth.uid() and status = 'PENDING');

-- Auto-generate nomor permintaan
create or replace function public.generate_nomor_permintaan()
returns text as $$
declare
  next_num integer;
  year_now text := to_char(now(), 'YYYY');
begin
  select coalesce(max(cast(substring(nomor from 10) as integer)), 0) + 1
    into next_num
    from public.permintaan_barang
    where nomor like 'PRM-' || year_now || '-%';
  return 'PRM-' || year_now || '-' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql security definer;


-- 2. TABEL BARANG MASUK
-- ============================================================
create table public.barang_masuk (
  id uuid default gen_random_uuid() primary key,
  no_faktur text not null unique,
  tanggal date not null default current_date,
  barang_id uuid references public.barang(id) on delete restrict not null,
  jumlah integer not null check (jumlah > 0),
  satuan text not null default 'Unit',
  harga_satuan numeric(15,2) not null default 0,
  supplier text default '',
  keterangan text default '',
  status text not null default 'SELESAI' check (status in ('PROSES','SELESAI')),
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text default '',
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.barang_masuk enable row level security;

create policy "barang_masuk viewable by authenticated" on public.barang_masuk
  for select using (auth.role() = 'authenticated');

create policy "barang_masuk manageable by admin" on public.barang_masuk
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('superadmin','admin')
  );

-- Trigger: tambah stock saat insert
create or replace function public.handle_barang_masuk_insert()
returns trigger as $$
begin
  update public.barang set stock = stock + new.jumlah where id = new.barang_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_barang_masuk_insert
  after insert on public.barang_masuk
  for each row execute procedure public.handle_barang_masuk_insert();

-- Trigger: koreksi stock saat update jumlah
create or replace function public.handle_barang_masuk_update()
returns trigger as $$
begin
  update public.barang set stock = stock - old.jumlah + new.jumlah where id = new.barang_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_barang_masuk_update
  after update on public.barang_masuk
  for each row execute procedure public.handle_barang_masuk_update();

-- Trigger: kembalikan stock saat delete
create or replace function public.handle_barang_masuk_delete()
returns trigger as $$
begin
  update public.barang set stock = stock - old.jumlah where id = old.barang_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_barang_masuk_delete
  after delete on public.barang_masuk
  for each row execute procedure public.handle_barang_masuk_delete();

-- Auto-generate no faktur
create or replace function public.generate_no_faktur()
returns text as $$
declare
  next_num integer;
  year_now text := to_char(now(), 'YYYY');
begin
  select coalesce(max(cast(substring(no_faktur from 10) as integer)), 0) + 1
    into next_num
    from public.barang_masuk
    where no_faktur like 'INV/' || year_now || '/%';
  return 'INV/' || year_now || '/' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql security definer;


-- 3. TABEL BARANG KELUAR
-- ============================================================
create table public.barang_keluar (
  id uuid default gen_random_uuid() primary key,
  no_transaksi text not null unique,
  tanggal date not null default current_date,
  barang_id uuid references public.barang(id) on delete restrict not null,
  jumlah integer not null check (jumlah > 0),
  tujuan text not null default '',
  penerima text not null default '',
  keterangan text default '',
  status text not null default 'SELESAI' check (status in ('SELESAI','BATAL')),
  permintaan_id uuid references public.permintaan_barang(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text default '',
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.barang_keluar enable row level security;

create policy "barang_keluar viewable by authenticated" on public.barang_keluar
  for select using (auth.role() = 'authenticated');

create policy "barang_keluar manageable by admin" on public.barang_keluar
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('superadmin','admin')
  );

-- Trigger: kurangi stock saat insert
create or replace function public.handle_barang_keluar_insert()
returns trigger as $$
declare current_stock integer;
begin
  select stock into current_stock from public.barang where id = new.barang_id;
  if current_stock < new.jumlah then
    raise exception 'Stok tidak mencukupi. Stok tersedia: %', current_stock;
  end if;
  update public.barang set stock = stock - new.jumlah where id = new.barang_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_barang_keluar_insert
  after insert on public.barang_keluar
  for each row execute procedure public.handle_barang_keluar_insert();

-- Trigger: kembalikan stock saat delete
create or replace function public.handle_barang_keluar_delete()
returns trigger as $$
begin
  update public.barang set stock = stock + old.jumlah where id = old.barang_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_barang_keluar_delete
  after delete on public.barang_keluar
  for each row execute procedure public.handle_barang_keluar_delete();

-- Auto-generate no transaksi keluar
create or replace function public.generate_no_transaksi_keluar()
returns text as $$
declare
  next_num integer;
  year_now text := to_char(now(), 'YYYY');
begin
  select coalesce(max(cast(substring(no_transaksi from 10) as integer)), 0) + 1
    into next_num
    from public.barang_keluar
    where no_transaksi like 'OUT/' || year_now || '/%';
  return 'OUT/' || year_now || '/' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql security definer;
