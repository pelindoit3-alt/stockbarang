import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KategoriClient from './kategori-client'

export default async function KategoriPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { data: kategori, error } = await supabase
    .from('kategori')
    .select('id, nama, deskripsi, created_at')
    .order('nama', { ascending: true })

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">
        <h3 className="font-extrabold text-lg mb-2">⚠️ Tabel Belum Disiapkan</h3>
        <p className="text-sm mb-2">Jalankan file <code className="bg-rose-100 px-1 rounded">schema_barang.sql</code> di Supabase SQL Editor terlebih dahulu.</p>
        <p className="text-xs text-rose-500">Error: {error.message}</p>
      </div>
    )
  }

  const canManage = ['superadmin', 'admin'].includes(profile?.role || '')

  return (
    <KategoriClient
      initialKategori={kategori || []}
      canManage={canManage}
    />
  )
}
