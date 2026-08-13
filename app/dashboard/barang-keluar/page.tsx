import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BarangKeluarClient from './barang-keluar-client';

export default async function BarangKeluarPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get user role for permissions if needed
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  const userRole = profile?.role || 'staff';

  try {
    // Fetch barang keluar with join to barang
    const { data: barangKeluarData, error: bkError } = await supabase
      .from('barang_keluar')
      .select(`
        *,
        barang:barang_id(nama_barang)
      `)
      .order('created_at', { ascending: false });

    if (bkError) {
      console.error('Error fetching barang keluar:', bkError);
      throw bkError;
    }

    // Fetch active barang for dropdown
    const { data: barangList, error: barangError } = await supabase
      .from('barang')
      .select('id, nama_barang, satuan, stock')
      .eq('is_active', true)
      .order('nama_barang', { ascending: true });

    if (barangError) {
      console.error('Error fetching barang:', barangError);
      throw barangError;
    }

    return (
      <BarangKeluarClient 
        initialData={barangKeluarData || []} 
        barangList={barangList || []}
        userRole={userRole}
      />
    );
    
  } catch (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan Database</h2>
          <p className="mb-4">Gagal memuat data. Pastikan tabel `barang_keluar` dan `barang` sudah di-setup di Supabase.</p>
          <pre className="bg-white/50 p-4 rounded-xl text-sm overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}
