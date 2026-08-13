import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StokClient from './stok-client'

export default async function StokPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all barang with kategori join
  const { data: barang, error: barangError } = await supabase
    .from('barang')
    .select(`
      id, kode_barang, nama_barang, kategori_id,
      merk, tipe_spesifikasi, satuan,
      stock, stock_minimum, harga, is_active,
      kategori:kategori_id ( nama )
    `)
    .order('kode_barang', { ascending: true })

  // Fetch kategori for dropdown
  const { data: kategori, error: kategoriError } = await supabase
    .from('kategori')
    .select('id, nama')
    .order('nama', { ascending: true })

  if (barangError || kategoriError) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">
        <h3 className="font-extrabold text-lg mb-2">⚠️ Tabel Belum Disiapkan</h3>
        <p className="text-sm mb-4 font-medium">
          Tabel <code className="bg-rose-100 px-1 rounded">barang</code> belum memiliki kolom yang dibutuhkan atau belum disiapkan.
          Silakan jalankan script SQL migrasi di Supabase SQL Editor.
        </p>
        <p className="text-xs text-rose-500">
          Error: {barangError?.message || kategoriError?.message}
        </p>
      </div>
    )
  }

  return (
    <StokClient
      barangList={(barang || []) as any}
      kategoriList={kategori || []}
    />
  )
}
