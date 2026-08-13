'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// UPDATE SINGLE STOCK MINIMUM
// ============================================================
export async function updateStockMinimum(id: string, stockMin: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  try {
    const { error } = await supabase
      .from('barang')
      .update({ stock_minimum: stockMin })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard/stok-minimum')
    revalidatePath('/dashboard/barang')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan: ' + err.message }
  }
}

// ============================================================
// UPDATE MULTIPLE STOCK MINIMUMS
// ============================================================
export async function updateMultipleStockMinimum(items: { id: string; stock_minimum: number }[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  try {
    // Perform updates in parallel or loop
    // Using simple loop since Supabase JS client doesn't support bulk update of different values in one call easily
    for (const item of items) {
      const { error } = await supabase
        .from('barang')
        .update({ stock_minimum: item.stock_minimum })
        .eq('id', item.id)
      
      if (error) return { error: `Gagal memperbarui item ${item.id}: ${error.message}` }
    }

    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard/stok-minimum')
    revalidatePath('/dashboard/barang')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan: ' + err.message }
  }
}
