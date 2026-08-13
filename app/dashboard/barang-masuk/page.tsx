import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BarangMasukClient from './barang-masuk-client'

export const dynamic = 'force-dynamic'

export default async function BarangMasukPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile for role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'USER'

  // Fetch data barang masuk
  const { data: dataMasuk, error: errorMasuk } = await supabase
    .from('barang_masuk')
    .select(`
      id, 
      no_faktur, 
      tanggal, 
      barang_id, 
      barang:barang_id(nama_barang, satuan), 
      jumlah, 
      satuan, 
      harga_satuan, 
      supplier, 
      keterangan, 
      status, 
      created_by_name, 
      created_at
    `)
    .order('created_at', { ascending: false })

  if (errorMasuk) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
          <h2 className="font-bold text-lg mb-1">Terjadi Kesalahan</h2>
          <p>Tabel belum disiapkan, jalankan schema_transaksi.sql</p>
          <p className="text-sm mt-2 opacity-75">{errorMasuk.message}</p>
        </div>
      </div>
    )
  }

  // Fetch daftar barang untuk dropdown
  const { data: barangList, error: errorBarang } = await supabase
    .from('barang')
    .select('id, nama_barang, satuan, stock')
    .eq('is_active', true)
    .order('nama_barang')

  if (errorBarang) {
    console.error("Error fetching barang list:", errorBarang)
  }

  // Transform data format to match interface if needed
  // Note: Supabase nested select returns single object or array depending on relation
  // Since barang_id is foreign key to barang, it returns a single object or null
  const formattedData = (dataMasuk || []).map((item: any) => ({
    ...item,
    barang: Array.isArray(item.barang) ? item.barang[0] : item.barang
  }))

  return (
    <BarangMasukClient 
      initialData={formattedData as any} 
      barangList={barangList || []} 
      userRole={userRole} 
    />
  )
}
