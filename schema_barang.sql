-- ============================================================
-- SCHEMA BARANG - Sistem Informasi Barang Divisi IT Pelindo
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. TABEL KATEGORI
-- ============================================================
create table if not exists public.kategori (
  id uuid default gen_random_uuid() primary key,
  nama text not null unique,
  deskripsi text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS untuk kategori
alter table public.kategori enable row level security;

create policy "Kategori viewable by authenticated" on public.kategori
  for select using (auth.role() = 'authenticated');

create policy "Kategori manageable by admin and superadmin" on public.kategori
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('superadmin', 'admin')
  );

-- 2. TABEL BARANG
-- ============================================================
create table if not exists public.barang (
  id uuid default gen_random_uuid() primary key,
  kode_barang text not null unique,
  nama_barang text not null,
  kategori_id uuid references public.kategori(id) on delete set null,
  merk text default '',
  tipe_spesifikasi text default '',
  satuan text not null default 'Unit',
  stock integer not null default 0 check (stock >= 0),
  stock_minimum integer not null default 0 check (stock_minimum >= 0),
  harga numeric(15,2) not null default 0 check (harga >= 0),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS untuk barang
alter table public.barang enable row level security;

create policy "Barang viewable by authenticated" on public.barang
  for select using (auth.role() = 'authenticated');

create policy "Barang manageable by admin and superadmin" on public.barang
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('superadmin', 'admin')
  );

-- 3. TRIGGER AUTO-UPDATE updated_at pada barang
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger on_barang_updated
  before update on public.barang
  for each row execute procedure public.handle_updated_at();

-- 4. FUNCTION AUTO-GENERATE KODE BARANG
-- ============================================================
create or replace function public.generate_kode_barang()
returns text as $$
declare
  next_num integer;
  kode text;
begin
  -- Ambil nomor urut berikutnya berdasarkan kode yang sudah ada
  select coalesce(
    max(cast(substring(kode_barang from 8) as integer)), 0
  ) + 1
  into next_num
  from public.barang
  where kode_barang like 'BRG-IT-%';
  
  kode := 'BRG-IT-' || lpad(next_num::text, 4, '0');
  return kode;
end;
$$ language plpgsql security definer;

-- 5. SEED DATA KATEGORI AWAL
-- ============================================================
insert into public.kategori (nama, deskripsi) values
  ('Perangkat', 'Laptop, Desktop, Server, dan perangkat keras utama'),
  ('Sparepart', 'Komponen pengganti perangkat keras'),
  ('Toner & Cartridge', 'Tinta dan toner untuk printer'),
  ('Aksesoris', 'Mouse, keyboard, headset, dan aksesoris komputer'),
  ('Networking', 'Kabel, switch, router, dan perangkat jaringan'),
  ('Lainnya', 'Barang IT lainnya yang tidak termasuk kategori di atas')
on conflict (nama) do nothing;
