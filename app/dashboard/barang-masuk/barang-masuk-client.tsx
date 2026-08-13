'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit2, Trash2, Filter, RefreshCcw, X, FileText, Calendar, Box, Package, Hash, DollarSign, Tag } from 'lucide-react'
import { createBarangMasuk, generateNoFaktur, deleteBarangMasuk } from './actions'

interface Barang {
  id: string
  nama_barang: string
  satuan: string
  stock: number
}

interface BarangMasukItem {
  id: string
  no_faktur: string
  tanggal: string
  barang_id: string
  barang: { nama_barang: string; satuan: string } | null
  jumlah: number
  satuan: string
  harga_satuan: number
  supplier: string
  keterangan: string
  status: string
  created_by_name: string
  created_at: string
}

interface Props {
  initialData: BarangMasukItem[]
  barangList: Barang[]
  userRole: string
}

export default function BarangMasukClient({ initialData, barangList, userRole }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const [formData, setFormData] = useState({
    no_faktur: '',
    tanggal: new Date().toISOString().split('T')[0],
    barang_id: '',
    jumlah: 0,
    satuan: '',
    harga_satuan: 0,
    supplier: '',
    keterangan: ''
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const suppliers = useMemo(() => {
    const uniqueSuppliers = new Set(initialData.map(item => item.supplier).filter(Boolean))
    return Array.from(uniqueSuppliers)
  }, [initialData])

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.no_faktur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barang?.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchDateFrom = dateFrom === '' || item.tanggal >= dateFrom
      const matchDateTo = dateTo === '' || item.tanggal <= dateTo
      const matchSupplier = supplierFilter === '' || item.supplier === supplierFilter
      const matchStatus = statusFilter === '' || item.status === statusFilter

      return matchSearch && matchDateFrom && matchDateTo && matchSupplier && matchStatus
    })
  }, [data, searchTerm, dateFrom, dateTo, supplierFilter, statusFilter])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const handleResetFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setSupplierFilter('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  const handleBarangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBarangId = e.target.value
    const selectedBarang = barangList.find(b => b.id === selectedBarangId)
    setFormData({
      ...formData,
      barang_id: selectedBarangId,
      satuan: selectedBarang ? selectedBarang.satuan : ''
    })
  }

  const handleGenerateFaktur = async () => {
    try {
      const result = await generateNoFaktur()
      if (result.data) {
        setFormData(prev => ({ ...prev, no_faktur: result.data as string }))
      } else {
        setAlert({ type: 'error', message: result.error || 'Gagal generate no faktur' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Terjadi kesalahan saat generate no faktur' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setAlert(null)
    
    try {
      const result = await createBarangMasuk(formData)
      if (result.success) {
        setAlert({ type: 'success', message: 'Barang masuk berhasil ditambahkan!' })
        setIsModalOpen(false)
        router.refresh()
        // Reset form
        setFormData({
          no_faktur: '',
          tanggal: new Date().toISOString().split('T')[0],
          barang_id: '',
          jumlah: 0,
          satuan: '',
          harga_satuan: 0,
          supplier: '',
          keterangan: ''
        })
      } else {
        setAlert({ type: 'error', message: result.error || 'Gagal menambahkan data' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Terjadi kesalahan tidak terduga' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const result = await deleteBarangMasuk(id)
        if (result.success) {
          setData(data.filter(item => item.id !== id))
          setAlert({ type: 'success', message: 'Data berhasil dihapus' })
          router.refresh()
        } else {
          setAlert({ type: 'error', message: result.error || 'Gagal menghapus data' })
        }
      } catch (error) {
        setAlert({ type: 'error', message: 'Terjadi kesalahan saat menghapus' })
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* Breadcrumb & Header */}
      <div className="px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-b border-slate-200">
        <div>
          <div className="text-sm font-medium text-slate-500 mb-1">
            Transaksi <span className="mx-2">/</span> Barang Masuk
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Barang Masuk</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Tambah Barang Masuk</span>
        </button>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {/* Alerts */}
        {alert && (
          <div className={`mb-6 p-4 rounded-xl border flex justify-between items-center ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span className="font-medium">{alert.message}</span>
            <button onClick={() => setAlert(null)} className="opacity-70 hover:opacity-100">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col xl:flex-row gap-4 xl:items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="No faktur, barang, supplier..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dari Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sampai Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supplier</label>
              <select 
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all appearance-none"
              >
                <option value="">Semua Supplier</option>
                {suppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="SELESAI">SELESAI</option>
                <option value="PROSES">PROSES</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(1)}
              className="flex-1 xl:flex-none bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Filter size={16} /> Filter
            </button>
            <button 
              onClick={handleResetFilters}
              className="flex-1 xl:flex-none bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-5 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No Faktur</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Barang</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Jumlah</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Satuan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Harga Satuan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dibuat Oleh</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.no_faktur}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {item.barang?.nama_barang || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                        {item.jumlah.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.satuan}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 text-right font-medium">
                        {formatCurrency(item.harga_satuan)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.created_by_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'SELESAI' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Box size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-600">Tidak ada data ditemukan</p>
                        <p className="text-sm">Coba sesuaikan filter pencarian Anda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="text-sm text-slate-500">
                Menampilkan <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="font-medium text-slate-900">{filteredData.length}</span> data
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-sm font-medium"
                >
                  Sebelumnya
                </button>
                <div className="flex gap-1 px-2">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium ${
                        currentPage === idx + 1
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-sm font-medium"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900">Tambah Barang Masuk</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="add-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700">No Faktur <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={formData.no_faktur}
                          onChange={(e) => setFormData({ ...formData, no_faktur: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          placeholder="FKT-..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateFaktur}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700">Tanggal <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="date"
                        required
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">Barang <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select
                        required
                        value={formData.barang_id}
                        onChange={handleBarangChange}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                      >
                        <option value="" disabled>Pilih Barang...</option>
                        {barangList.map(b => (
                          <option key={b.id} value={b.id}>{b.nama_barang} (Stok: {b.stock} {b.satuan})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700">Jumlah <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.jumlah || ''}
                        onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700">Satuan</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        disabled
                        value={formData.satuan}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                        placeholder="Auto-fill"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700">Harga Satuan <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rp</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.harga_satuan || ''}
                        onChange={(e) => setFormData({ ...formData, harga_satuan: Number(e.target.value) })}
                        className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700">Supplier <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Nama Supplier"
                    />
                  </div>

                  <div className="space-y-2 text-left md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">Keterangan (Opsional)</label>
                    <textarea
                      rows={3}
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                      placeholder="Tambahkan keterangan jika ada..."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
