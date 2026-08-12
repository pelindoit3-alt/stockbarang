'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// TYPES
// ============================================================
export interface BarangFormData {
  nama_barang: string
  kategori_id: string
  merk: string
  tipe_spesifikasi: string
  satuan: string
  stock: number
  stock_minimum: number
  is_active: boolean
}

// ============================================================
// CREATE BARANG
// ============================================================
export async function createBarang(formData: BarangFormData) {
  const supabase = await createClient()

  // Verify caller is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  try {
    // Auto-generate kode barang
    const { data: kodeData, error: kodeError } = await supabase
      .rpc('generate_kode_barang')

    if (kodeError) return { error: 'Gagal generate kode barang: ' + kodeError.message }

    const { data, error } = await supabase
      .from('barang')
      .insert({
        kode_barang: kodeData,
        nama_barang: formData.nama_barang,
        kategori_id: formData.kategori_id || null,
        merk: formData.merk,
        tipe_spesifikasi: formData.tipe_spesifikasi,
        satuan: formData.satuan,
        stock: formData.stock,
        stock_minimum: formData.stock_minimum,
        is_active: formData.is_active,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/barang')
    return { success: true, data }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan: ' + err.message }
  }
}

// ============================================================
// UPDATE BARANG
// ============================================================
export async function updateBarang(id: string, formData: BarangFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  try {
    const { data, error } = await supabase
      .from('barang')
      .update({
        nama_barang: formData.nama_barang,
        kategori_id: formData.kategori_id || null,
        merk: formData.merk,
        tipe_spesifikasi: formData.tipe_spesifikasi,
        satuan: formData.satuan,
        stock: formData.stock,
        stock_minimum: formData.stock_minimum,
        is_active: formData.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/barang')
    return { success: true, data }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan: ' + err.message }
  }
}

// ============================================================
// TOGGLE ACTIVE STATUS
// ============================================================
export async function toggleBarangActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { error } = await supabase
    .from('barang')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/barang')
  return { success: true }
}

// ============================================================
// DELETE BARANG
// ============================================================
export async function deleteBarang(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
    return { error: 'Akses ditolak.' }
  }

  const { error } = await supabase
    .from('barang')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/barang')
  return { success: true }
}
