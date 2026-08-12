'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createKategori(nama: string, deskripsi: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  if (!nama.trim()) return { error: 'Nama kategori wajib diisi.' }

  const { data, error } = await supabase
    .from('kategori')
    .insert({ nama: nama.trim(), deskripsi: deskripsi.trim() })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Nama kategori sudah ada.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/kategori')
  revalidatePath('/dashboard/barang')
  return { success: true, data }
}

export async function deleteKategori(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!['superadmin', 'admin'].includes(profile?.role || ''))
    return { error: 'Akses ditolak.' }

  const { error } = await supabase.from('kategori').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/kategori')
  revalidatePath('/dashboard/barang')
  return { success: true }
}
