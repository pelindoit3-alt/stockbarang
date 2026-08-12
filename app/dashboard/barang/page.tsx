import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BarangClient from './barang-client'

export default async function BarangPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Fetch semua barang + join kategori
  const { data: barang, error: barangError } = await supabase
    .from('barang')
    .select(`
      id, kode_barang, nama_barang, kategori_id,
      merk, tipe_spesifikasi, satuan,
      stock, stock_minimum, is_active,
      kategori:kategori_id ( nama )
    `)
    .order('kode_barang', { ascending: true })

  // Fetch semua kategori untuk dropdown
  const { data: kategori, error: kategoriError } = await supabase
    .from('kategori')
    .select('id, nama')
    .order('nama', { ascending: true })

  // Error state jika tabel belum dibuat
  if (barangError || kategoriError) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">
        <h3 className="font-extrabold text-lg mb-2">⚠️ Tabel Belum Disiapkan</h3>
        <p className="text-sm mb-4 font-medium">
          Tabel <code className="bg-rose-100 px-1 rounded">barang</code> dan <code className="bg-rose-100 px-1 rounded">kategori</code> belum ada di database.
          Silakan jalankan script SQL berikut di <strong>Supabase SQL Editor</strong>:
        </p>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-auto max-h-48">
          <p>Salin isi file <strong>schema_barang.sql</strong> dan jalankan di Supabase SQL Editor.</p>
        </div>
        <p className="text-xs mt-3 text-rose-500 font-semibold">
          Error: {barangError?.message || kategoriError?.message}
        </p>
      </div>
    )
  }

  return (
    <BarangClient
      initialBarang={(barang || []) as any}
      kategoriList={kategori || []}
      userRole={profile?.role || 'staff'}
    />
  )
}
