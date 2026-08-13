'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, RotateCcw, Eye, Pencil, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, AlertCircle, XCircle, Package,
  AlertTriangle, Check, Info, Settings, Save, ShieldAlert
} from 'lucide-react'
import { updateStockMinimum, updateMultipleStockMinimum } from './actions'

interface Kategori {
  id: string
  nama: string
}

interface Barang {
  id: string
  kode_barang: string
  nama_barang: string
  kategori_id: string | null
  kategori: { nama: string } | null
  merk: string
  tipe_spesifikasi: string
  satuan: string
  stock: number
  stock_minimum: number
  is_active: boolean
}

interface Props {
  barangList: Barang[]
  kategoriList: Kategori[]
  canManage: boolean
}

function getStatusStok(stock: number, stockMin: number) {
  if (stock === 0) return { label: 'HABIS', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  if (stock <= stockMin) return { label: 'MENIPIS', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'AMAN', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

const PAGE_SIZE = 10

export default function StokMinimumClient({ barangList, kategoriList, canManage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filter States
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Automatical Filter when stock < 5: TRUE BY DEFAULT
  const [onlyLowStock, setOnlyLowStock] = useState(true)
  
  const [currentPage, setCurrentPage] = useState(1)

  // Alert Notifications
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Single Edit Modal State
  const [editItem, setEditItem] = useState<Barang | null>(null)
  const [newStockMin, setNewStockMin] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  // Bulk Edit Modal State
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkItems, setBulkItems] = useState<{ id: string; kode_barang: string; nama_barang: string; stock: number; stock_minimum: number }[]>([])

  // Detail Modal State
  const [detailItem, setDetailItem] = useState<Barang | null>(null)

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text })
    setTimeout(() => setAlert(null), 4000)
  }

  // Calculated Stats
  const stats = useMemo(() => {
    let totalBarang = barangList.length
    let stockMenipis = 0
    let stockHabis = 0
    let aman = 0

    barangList.forEach(b => {
      if (b.stock === 0) {
        stockHabis++
      } else if (b.stock <= b.stock_minimum) {
        stockMenipis++
      } else {
        aman++
      }
    })

    return { totalBarang, stockMenipis, stockHabis, aman }
  }, [barangList])

  // Filter Logic
  const filteredBarang = useMemo(() => {
    return barangList.filter(b => {
      // Search
      const matchesSearch = !search ||
        b.kode_barang.toLowerCase().includes(search.toLowerCase()) ||
        b.nama_barang.toLowerCase().includes(search.toLowerCase())

      // Category
      const matchesKategori = !filterKategori || b.kategori_id === filterKategori

      // Status
      const statusLabel = getStatusStok(b.stock, b.stock_minimum).label
      const matchesStatus = !filterStatus || statusLabel === filterStatus

      // "Otomatis muncul barangnya ketika stoknya kurang dari 5"
      // If checked, only show items with stock < 5
      const matchesLowStockLimit = !onlyLowStock || b.stock < 5

      return matchesSearch && matchesKategori && matchesStatus && matchesLowStockLimit
    })
  }, [barangList, search, filterKategori, filterStatus, onlyLowStock])

  // Pagination Logic
  const totalPages = Math.ceil(filteredBarang.length / PAGE_SIZE)
  const paginatedBarang = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredBarang.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredBarang, currentPage])

  const handleReset = () => {
    setSearch('')
    setFilterKategori('')
    setFilterStatus('')
    setOnlyLowStock(true) // Keep low stock filter active on reset as it is the default requested behavior
    setCurrentPage(1)
  }

  // Handle Single Update
  const handleSingleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setIsSaving(true)
    
    const result = await updateStockMinimum(editItem.id, newStockMin)
    setIsSaving(false)

    if (result.error) {
      showAlert('error', result.error)
      return
    }

    setEditItem(null)
    showAlert('success', 'Batas minimum stock berhasil diperbarui!')
    router.refresh()
  }

  // Open Bulk Edit Modal
  const handleOpenBulkEdit = () => {
    // Populate with low stock items or all items matching current filter
    const itemsToEdit = filteredBarang.map(b => ({
      id: b.id,
      kode_barang: b.kode_barang,
      nama_barang: b.nama_barang,
      stock: b.stock,
      stock_minimum: b.stock_minimum
    }))
    setBulkItems(itemsToEdit)
    setBulkEditOpen(true)
  }

  // Save Bulk Changes
  const handleBulkSave = async () => {
    setIsSaving(true)
    const result = await updateMultipleStockMinimum(
      bulkItems.map(item => ({ id: item.id, stock_minimum: item.stock_minimum }))
    )
    setIsSaving(false)

    if (result.error) {
      showAlert('error', result.error)
      return
    }

    setBulkEditOpen(false)
    showAlert('success', 'Semua batas minimum stock berhasil diperbarui!')
    router.refresh()
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Dashboard</span>
            <span>›</span>
            <span>Stock</span>
            <span>›</span>
            <span className="text-slate-600">Stock Minimum</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Stock Minimum</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola batas minimum stock untuk setiap barang.</p>
        </div>

        {canManage && filteredBarang.length > 0 && (
          <button
            onClick={handleOpenBulkEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>Ubah Multiple</span>
          </button>
        )}
      </div>

      {/* ALERTS */}
      {alert && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold animate-slide-in ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          {alert.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Barang */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Barang</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.totalBarang.toLocaleString('id-ID')}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Semua barang</p>
          </div>
        </div>

        {/* Stock Menipis */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Menipis</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.stockMenipis.toLocaleString('id-ID')}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Stock ≤ Minimum</p>
          </div>
        </div>

        {/* Stock Habis */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Habis</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.stockHabis.toLocaleString('id-ID')}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Stock = 0</p>
          </div>
        </div>

        {/* Aman */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aman</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.aman.toLocaleString('id-ID')}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Stock &gt; Minimum</p>
          </div>
        </div>

      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
            />
          </div>

          {/* Kategori */}
          <select
            value={filterKategori}
            onChange={e => { setFilterKategori(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer min-w-[140px]"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer min-w-[130px]"
          >
            <option value="">Semua Status</option>
            <option value="AMAN">AMAN</option>
            <option value="MENIPIS">MENIPIS</option>
            <option value="HABIS">HABIS</option>
          </select>

          {/* "Otomatis muncul barangnya ketika stoknya kurang dari 5" */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-800 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              id="lowStockCheck"
              checked={onlyLowStock}
              onChange={e => { setOnlyLowStock(e.target.checked); setCurrentPage(1) }}
              className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-200 rounded-sm focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="lowStockCheck" className="cursor-pointer font-bold">
              Hanya Stok &lt; 5
            </label>
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3.5">No</th>
                <th className="px-4 py-3.5">Kode Barang</th>
                <th className="px-4 py-3.5">Nama Barang</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Satuan</th>
                <th className="px-4 py-3.5 text-center">Stock Saat</th>
                <th className="px-4 py-3.5 text-center">Stock Minimum</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Selisih</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedBarang.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShieldAlert className="w-10 h-10" />
                      <span className="text-sm font-semibold">Tidak ada barang terdeteksi limit stok</span>
                      <span className="text-xs">Ubah filter atau nonaktifkan pilihan "Hanya Stok &lt; 5" untuk melihat barang lainnya</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBarang.map((b, idx) => {
                const status = getStatusStok(b.stock, b.stock_minimum)
                const no = (currentPage - 1) * PAGE_SIZE + idx + 1
                const difference = b.stock - b.stock_minimum
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-semibold">{no}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-[11px]">{b.kode_barang}</td>
                    <td className="px-4 py-3.5 font-semibold max-w-[200px] truncate">{b.nama_barang}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.kategori?.nama || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.satuan}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{b.stock}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-600">{b.stock_minimum}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {difference >= 0 ? (
                        <span className="font-extrabold text-emerald-600">+{difference}</span>
                      ) : (
                        <span className="font-extrabold text-rose-600">{difference}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canManage && (
                          <button
                            onClick={() => { setEditItem(b); setNewStockMin(b.stock_minimum) }}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Ubah Minimum Stok"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDetailItem(b)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Detail Barang"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {filteredBarang.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] text-slate-400 font-semibold">
              Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredBarang.length)}–{Math.min(currentPage * PAGE_SIZE, filteredBarang.length)} dari {filteredBarang.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Ubah Stock Minimum</h2>
              </div>
              <button onClick={() => setEditItem(null)} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSingleSave} className="p-6 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wide">Nama Barang</p>
                  <p className="font-extrabold text-slate-800 text-[13px]">{editItem.nama_barang}</p>
                  <div className="flex justify-between pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                    <span>Kode: <strong className="font-mono text-blue-600 font-bold">{editItem.kode_barang}</strong></span>
                    <span>Stok Saat Ini: <strong className="text-slate-800 font-extrabold">{editItem.stock} {editItem.satuan}</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Stock Minimum Baru <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newStockMin}
                    onChange={e => setNewStockMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Tentukan batas stock minimum untuk memicu status MENIPIS.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK EDIT MODAL */}
      {bulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Ubah Multiple Batas Minimum</h2>
              </div>
              <button onClick={() => setBulkEditOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <p className="text-xs text-slate-400 font-semibold">
                Silakan edit batas minimum stock untuk seluruh barang di bawah ini sekaligus.
              </p>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                      <th className="px-4 py-2.5">Kode</th>
                      <th className="px-4 py-2.5">Nama Barang</th>
                      <th className="px-4 py-2.5 text-center">Stok</th>
                      <th className="px-4 py-2.5 text-center w-36">Min Stok Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bulkItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-mono font-bold text-blue-600 text-[10px]">{item.kode_barang}</td>
                        <td className="px-4 py-2 font-semibold max-w-[200px] truncate">{item.nama_barang}</td>
                        <td className="px-4 py-2 text-center font-bold text-slate-800">{item.stock}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={item.stock_minimum}
                            onChange={e => {
                              const newVal = parseInt(e.target.value) || 0
                              setBulkItems(prev => prev.map(p => p.id === item.id ? { ...p, stock_minimum: newVal } : p))
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setBulkEditOpen(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleBulkSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Detail Barang</h2>
              </div>
              <button onClick={() => setDetailItem(null)} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Kode Barang</span>
                  <span className="font-mono font-bold text-blue-600">{detailItem.kode_barang}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Nama Barang</span>
                  <span className="font-bold text-slate-800 text-right">{detailItem.nama_barang}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Kategori</span>
                  <span className="font-bold text-slate-800">{detailItem.kategori?.nama || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Merk</span>
                  <span className="font-bold text-slate-800">{detailItem.merk || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Tipe / Spesifikasi</span>
                  <span className="font-bold text-slate-800 text-right">{detailItem.tipe_spesifikasi || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Stok Saat Ini</span>
                  <span className="font-extrabold text-slate-800">{detailItem.stock} {detailItem.satuan}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Stok Minimum</span>
                  <span className="font-extrabold text-slate-600">{detailItem.stock_minimum} {detailItem.satuan}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
