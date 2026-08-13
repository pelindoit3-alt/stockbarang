'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPermintaan(form: {
  barang_id: string
  jumlah: number
  keperluan: string
  keterangan: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const { data: nomor, error: nErr } = await supabase.rpc('generate_nomor_permintaan')
  if (nErr) return { error: 'Gagal generate nomor.' }

  const { data, error } = await supabase.from('permintaan_barang').insert({
    nomor,
    pemohon_id: user.id,
    pemohon_nama: profile?.full_name || user.email || '',
    barang_id: form.barang_id,
    jumlah: form.jumlah,
    keperluan: form.keperluan,
    keterangan: form.keterangan,
    status: 'PENDING',
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/permintaan')
  return { success: true, data }
}

export async function approvePermintaan(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
  if (!['superadmin', 'admin'].includes(profile?.role || '')) return { error: 'Akses ditolak.' }

  const { error } = await supabase.from('permintaan_barang').update({
    status: 'APPROVED',
    approved_by: user.id,
    approved_by_name: profile?.full_name || '',
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/permintaan')
  return { success: true }
}

export async function rejectPermintaan(id: string, alasan: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['superadmin', 'admin'].includes(profile?.role || '')) return { error: 'Akses ditolak.' }

  const { error } = await supabase.from('permintaan_barang').update({
    status: 'REJECTED',
    alasan_penolakan: alasan,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/permintaan')
  return { success: true }
}

export async function cancelPermintaan(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { error } = await supabase.from('permintaan_barang').update({ status: 'CANCELLED' }).eq('id', id).eq('pemohon_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/permintaan')
  return { success: true }
}

export async function prosesBarangKeluar(permintaanId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
  if (!['superadmin', 'admin'].includes(profile?.role || '')) return { error: 'Akses ditolak.' }

  // Get permintaan detail
  const { data: prm, error: pErr } = await supabase
    .from('permintaan_barang')
    .select('*, barang:barang_id(nama_barang, satuan)')
    .eq('id', permintaanId)
    .single()

  if (pErr || !prm) return { error: 'Permintaan tidak ditemukan.' }
  if (!['APPROVED'].includes(prm.status)) return { error: 'Permintaan harus berstatus APPROVED.' }

  // Update status → PROCESSING
  await supabase.from('permintaan_barang').update({ status: 'PROCESSING' }).eq('id', permintaanId)

  // Generate no transaksi keluar
  const { data: noData, error: noErr } = await supabase.rpc('generate_no_transaksi_keluar')
  if (noErr) return { error: 'Gagal generate nomor transaksi.' }

  // Create barang keluar
  const { error: outErr } = await supabase.from('barang_keluar').insert({
    no_transaksi: noData,
    tanggal: new Date().toISOString().split('T')[0],
    barang_id: prm.barang_id,
    jumlah: prm.jumlah,
    tujuan: prm.keperluan,
    penerima: prm.pemohon_nama,
    keterangan: `Dari permintaan ${prm.nomor}`,
    status: 'SELESAI',
    permintaan_id: permintaanId,
    created_by: user.id,
    created_by_name: profile?.full_name || '',
  })

  if (outErr) {
    // Revert status
    await supabase.from('permintaan_barang').update({ status: 'APPROVED' }).eq('id', permintaanId)
    return { error: outErr.message }
  }

  // Update permintaan → COMPLETED
  await supabase.from('permintaan_barang').update({ status: 'COMPLETED' }).eq('id', permintaanId)

  revalidatePath('/dashboard/permintaan')
  revalidatePath('/dashboard/barang-keluar')
  revalidatePath('/dashboard/barang')
  return { success: true }
}
