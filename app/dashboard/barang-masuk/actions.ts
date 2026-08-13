'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBarangMasuk(form: {
  no_faktur: string
  tanggal: string
  barang_id: string
  jumlah: number
  harga_satuan: number
  supplier: string
  keterangan: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
  if (!['superadmin', 'admin'].includes(profile?.role || '')) return { error: 'Akses ditolak.' }

  // Get satuan dari barang
  const { data: barang } = await supabase.from('barang').select('satuan').eq('id', form.barang_id).single()

  const { data, error } = await supabase.from('barang_masuk').insert({
    no_faktur: form.no_faktur,
    tanggal: form.tanggal,
    barang_id: form.barang_id,
    jumlah: form.jumlah,
    satuan: barang?.satuan || 'Unit',
    harga_satuan: form.harga_satuan,
    supplier: form.supplier,
    keterangan: form.keterangan,
    status: 'SELESAI',
    created_by: user.id,
    created_by_name: profile?.full_name || user.email || '',
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/barang-masuk')
  revalidatePath('/dashboard/barang')
  return { success: true, data }
}

export async function generateNoFaktur() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generate_no_faktur')
  if (error) return { error: error.message }
  return { data }
}

export async function deleteBarangMasuk(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }
  const { error } = await supabase.from('barang_masuk').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/barang-masuk')
  revalidatePath('/dashboard/barang')
  return { success: true }
}
