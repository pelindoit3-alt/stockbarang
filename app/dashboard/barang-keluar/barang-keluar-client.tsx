'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  X, 
  Calendar, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { createBarangKeluar, deleteBarangKeluar } from './actions';

export interface Barang {
  id: string;
  nama_barang: string;
  satuan: string;
  stock: number;
}

export interface BarangKeluarItem {
  id: string;
  no_transaksi: string;
  tanggal: string;
  barang_id: string;
  barang: { nama_barang: string } | null;
  jumlah: number;
  tujuan: string;
  penerima: string;
  keterangan: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

export interface Props {
  initialData: BarangKeluarItem[];
  barangList: Barang[];
  userRole: string;
}

export default function BarangKeluarClient({ initialData, barangList, userRole }: Props) {
  const router = useRouter();
  
  const [data, setData] = useState<BarangKeluarItem[]>(initialData);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTanggalDari, setFilterTanggalDari] = useState('');
  const [filterTanggalSampai, setFilterTanggalSampai] = useState('');
  const [filterBarang, setFilterBarang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BarangKeluarItem | null>(null);
  
  // Add Form State
  const [selectedBarangId, setSelectedBarangId] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [tujuan, setTujuan] = useState('');
  const [penerima, setPenerima] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const selectedBarang = useMemo(() => 
    barangList.find(b => b.id === selectedBarangId),
    [selectedBarangId, barangList]
  );
  
  const jumlahError = useMemo(() => {
    if (selectedBarang && typeof jumlah === 'number' && jumlah > selectedBarang.stock) {
      return `Jumlah tidak boleh melebihi stock tersedia (${selectedBarang.stock})`;
    }
    return null;
  }, [selectedBarang, jumlah]);

  // Derived Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = 
        item.no_transaksi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barang?.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.penerima?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      const matchBarang = filterBarang ? item.barang_id === filterBarang : true;
      
      const itemDate = new Date(item.tanggal);
      const matchDateFrom = filterTanggalDari ? itemDate >= new Date(filterTanggalDari) : true;
      const matchDateTo = filterTanggalSampai ? itemDate <= new Date(filterTanggalSampai) : true;
      
      return matchSearch && matchStatus && matchBarang && matchDateFrom && matchDateTo;
    });
  }, [data, searchTerm, filterStatus, filterBarang, filterTanggalDari, filterTanggalSampai]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterTanggalDari('');
    setFilterTanggalSampai('');
    setFilterBarang('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jumlahError) return;
    
    setIsSubmitting(true);
    setAlertMessage(null);
    
    try {
      const result = await createBarangKeluar({
        tanggal: new Date().toISOString().split('T')[0],
        barang_id: selectedBarangId,
        jumlah: typeof jumlah === 'number' ? jumlah : 0,
        tujuan: tujuan,
        penerima: penerima,
        keterangan: keterangan,
      });
      
      if (result.error) {
        setAlertMessage({ type: 'error', text: result.error });
      } else {
        setAlertMessage({ type: 'success', text: 'Barang Keluar berhasil ditambahkan' });
        setTimeout(() => {
          setIsAddModalOpen(false);
          resetAddForm();
          router.refresh();
        }, 1500);
      }
    } catch (error: any) {
      setAlertMessage({ type: 'error', text: error.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const result = await deleteBarangKeluar(itemToDelete.id);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      alert('Gagal menghapus data');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const resetAddForm = () => {
    setSelectedBarangId('');
    setJumlah('');
    setTujuan('');
    setPenerima('');
    setKeterangan('');
    setAlertMessage(null);
  };

  const openAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex-1 p-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="text-sm text-slate-500 mb-1">Transaksi / Barang Keluar</div>
          <h1 className="text-3xl font-bold text-slate-800">Data Barang Keluar</h1>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
        >
          <Plus size={20} />
          Tambah Barang Keluar
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari transaksi, barang, penerima..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <input
              type="date"
              value={filterTanggalDari}
              onChange={(e) => setFilterTanggalDari(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            {!filterTanggalDari && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">Dari Tanggal</span>}
          </div>
          
          <div className="relative">
            <input
              type="date"
              value={filterTanggalSampai}
              onChange={(e) => setFilterTanggalSampai(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            {!filterTanggalSampai && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">Sampai Tanggal</span>}
          </div>

          <select
            value={filterBarang}
            onChange={(e) => setFilterBarang(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
          >
            <option value="">Semua Barang</option>
            {barangList.map(b => (
              <option key={b.id} value={b.id}>{b.nama_barang}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="SELESAI">SELESAI</option>
            <option value="BATAL">BATAL</option>
          </select>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="text-slate-500 hover:text-slate-700 px-4 py-2 text-sm font-medium transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">No Transaksi</th>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Tujuan / Keperluan</th>
                <th className="px-6 py-4">Penerima</th>
                <th className="px-6 py-4">Dibuat Oleh</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.no_transaksi}</td>
                    <td className="px-6 py-4">{item.barang?.nama_barang || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{item.jumlah}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.tujuan}>{item.tujuan}</td>
                    <td className="px-6 py-4">{item.penerima}</td>
                    <td className="px-6 py-4">{item.created_by_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.status === 'SELESAI' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setItemToDelete(item);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-2"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data barang keluar yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800">Tambah Barang Keluar</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {alertMessage && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                  alertMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{alertMessage.text}</p>
                </div>
              )}

              <form id="add-form" onSubmit={handleAddSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Barang <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={selectedBarangId}
                    onChange={(e) => setSelectedBarangId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
                  >
                    <option value="" disabled>Pilih Barang...</option>
                    {barangList.map(b => (
                      <option key={b.id} value={b.id}>{b.nama_barang} ({b.satuan})</option>
                    ))}
                  </select>
                  {selectedBarang && (
                    <div className="mt-2 inline-flex bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200">
                      Stock Tersedia: {selectedBarang.stock} {selectedBarang.satuan}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : '')}
                    className={`w-full p-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all text-slate-700 ${
                      jumlahError 
                        ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Masukkan jumlah"
                  />
                  {jumlahError && (
                    <p className="mt-1.5 text-sm text-rose-500 font-medium">{jumlahError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tujuan / Keperluan <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={2}
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 resize-none"
                    placeholder="Contoh: Produksi batch A"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Penerima <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={penerima}
                    onChange={(e) => setPenerima(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
                    placeholder="Nama penerima barang"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan (Opsional)</label>
                  <textarea
                    rows={2}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 resize-none"
                    placeholder="Tambahkan catatan jika ada"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-form"
                disabled={isSubmitting || !!jumlahError}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Data?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Anda yakin ingin menghapus data transaksi <strong>{itemToDelete.no_transaksi}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors flex-1"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
