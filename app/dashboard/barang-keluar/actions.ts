'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBarangKeluar(form: {
  tanggal: string
  barang_id: string
  jumlah: number
  tujuan: string
  penerima: string
  keterangan: string
  permintaan_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
  if (!['superadmin', 'admin'].includes(profile?.role || '')) return { error: 'Akses ditolak.' }

  const { data: noData, error: noError } = await supabase.rpc('generate_no_transaksi_keluar')
  if (noError) return { error: 'Gagal generate nomor transaksi.' }

  const { data, error } = await supabase.from('barang_keluar').insert({
    no_transaksi: noData,
    tanggal: form.tanggal,
    barang_id: form.barang_id,
    jumlah: form.jumlah,
    tujuan: form.tujuan,
    penerima: form.penerima,
    keterangan: form.keterangan,
    status: 'SELESAI',
    permintaan_id: form.permintaan_id || null,
    created_by: user.id,
    created_by_name: profile?.full_name || user.email || '',
  }).select().single()

  if (error) return { error: error.message }

  // Jika dari permintaan, update status permintaan → COMPLETED
  if (form.permintaan_id) {
    await supabase.from('permintaan_barang')
      .update({ status: 'COMPLETED' })
      .eq('id', form.permintaan_id)
  }

  revalidatePath('/dashboard/barang-keluar')
  revalidatePath('/dashboard/barang')
  revalidatePath('/dashboard/permintaan')
  return { success: true, data }
}

export async function deleteBarangKeluar(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }
  const { error } = await supabase.from('barang_keluar').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/barang-keluar')
  revalidatePath('/dashboard/barang')
  return { success: true }
}
