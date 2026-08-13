import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PermintaanClient from './permintaan-client'

export default async function PermintaanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const { data: permintaan, error } = await supabase
    .from('permintaan_barang')
    .select(`
      id, nomor, tanggal,
      pemohon_id, pemohon_nama,
      barang_id, barang:barang_id ( nama_barang, stock ),
      jumlah, keperluan, keterangan, status,
      alasan_penolakan, approved_by_name, created_at
    `)
    .order('created_at', { ascending: false })

  const { data: barangList, error: bErr } = await supabase
    .from('barang')
    .select('id, nama_barang, stock, satuan')
    .eq('is_active', true)
    .gt('stock', 0)
    .order('nama_barang')

  if (error || bErr) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">
        <h3 className="font-extrabold text-lg mb-2">⚠️ Tabel Belum Disiapkan</h3>
        <p className="text-sm mb-2">Jalankan file <code className="bg-rose-100 px-1 rounded">schema_transaksi.sql</code> di Supabase SQL Editor.</p>
        <p className="text-xs text-rose-500">Error: {error?.message || bErr?.message}</p>
      </div>
    )
  }

  return (
    <PermintaanClient
      initialData={(permintaan || []) as any}
      barangList={barangList || []}
      userId={user.id}
      userRole={profile?.role || 'staff'}
    />
  )
}
