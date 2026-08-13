'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, RotateCcw, Eye, Pencil, BarChart2,
  ChevronLeft, ChevronRight, Download, RefreshCw,
  Package, Database, AlertTriangle, XCircle, DollarSign,
  TrendingDown, CheckCircle, Info
} from 'lucide-react'

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
  harga: number
  is_active: boolean
}

interface Props {
  barangList: Barang[]
  kategoriList: Kategori[]
}

function getStatusStok(stock: number, stockMin: number) {
  if (stock === 0) return { label: 'HABIS', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  if (stock <= stockMin) return { label: 'MENIPIS', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'AMAN', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

export default function StokClient({ barangList, kategoriList }: Props) {
  const router = useRouter()
  
  // Filter States
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSatuan, setFilterSatuan] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Selected item detail modal
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null)

  // Unique Satuans in database for dropdown filter
  const uniqueSatuans = useMemo(() => {
    const sets = new Set(barangList.map(b => b.satuan).filter(Boolean))
    return Array.from(sets).sort()
  }, [barangList])

  // Calculated Stats (Overall unfiltered)
  const stats = useMemo(() => {
    let totalBarang = barangList.length
    let totalStock = 0
    let stockMenipis = 0
    let stockHabis = 0
    let totalNilai = 0

    barangList.forEach(b => {
      totalStock += b.stock
      totalNilai += b.stock * b.harga
      if (b.stock === 0) {
        stockHabis++
      } else if (b.stock <= b.stock_minimum) {
        stockMenipis++
      }
    })

    return { totalBarang, totalStock, stockMenipis, stockHabis, totalNilai }
  }, [barangList])

  // Filtering Logic
  const filteredBarang = useMemo(() => {
    return barangList.filter(b => {
      const matchesSearch = !search || 
        b.kode_barang.toLowerCase().includes(search.toLowerCase()) ||
        b.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
        b.merk.toLowerCase().includes(search.toLowerCase())
      
      const matchesKategori = !filterKategori || b.kategori_id === filterKategori
      
      const statusLabel = getStatusStok(b.stock, b.stock_minimum).label
      const matchesStatus = !filterStatus || statusLabel === filterStatus
      
      const matchesSatuan = !filterSatuan || b.satuan === filterSatuan

      return matchesSearch && matchesKategori && matchesStatus && matchesSatuan
    })
  }, [barangList, search, filterKategori, filterStatus, filterSatuan])

  // Pagination Logic
  const totalPages = Math.ceil(filteredBarang.length / pageSize)
  const paginatedBarang = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredBarang.slice(startIndex, startIndex + pageSize)
  }, [filteredBarang, currentPage, pageSize])

  const handleReset = () => {
    setSearch('')
    setFilterKategori('')
    setFilterStatus('')
    setFilterSatuan('')
    setCurrentPage(1)
  }

  // Export CSV (Excel format client-side)
  const handleExportCSV = () => {
    const headers = ['No', 'Kode Barang', 'Nama Barang', 'Kategori', 'Merk', 'Stock', 'Satuan', 'Stock Minimum', 'Status', 'Nilai Stock']
    const rows = filteredBarang.map((b, i) => [
      i + 1,
      b.kode_barang,
      b.nama_barang,
      b.kategori?.nama || '-',
      b.merk || '-',
      b.stock,
      b.satuan,
      b.stock_minimum,
      getStatusStok(b.stock, b.stock_minimum).label,
      b.stock * b.harga
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Stok_Barang_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <span className="text-slate-600">Stock Barang</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Stock Barang</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola dan pantau stock seluruh barang di Divisi IT.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={() => { router.refresh(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-hover-spin" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Barang */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Barang</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.totalBarang.toLocaleString('id-ID')}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Semua item</p>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Stock</p>
            <h3 className="text-xl font-extrabold text-slate-900">{stats.totalStock.toLocaleString('id-ID')}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Total seluruh stock</p>
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

        {/* Nilai Total Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nilai Total Stock</p>
            <h3 className="text-sm font-extrabold text-emerald-700 truncate" title={formatRupiah(stats.totalNilai)}>
              {formatRupiah(stats.totalNilai)}
            </h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Berdasarkan harga terakhir</p>
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
            />
          </div>

          {/* Kategori Dropdown */}
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

          {/* Status Dropdown */}
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

          {/* Satuan Dropdown */}
          <select
            value={filterSatuan}
            onChange={e => { setFilterSatuan(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer min-w-[130px]"
          >
            <option value="">Semua Satuan</option>
            {uniqueSatuans.map(sat => (
              <option key={sat} value={sat}>{sat}</option>
            ))}
          </select>

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

      {/* STOCKS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3.5">No</th>
                <th className="px-4 py-3.5">Kode Barang</th>
                <th className="px-4 py-3.5">Nama Barang</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Merk</th>
                <th className="px-4 py-3.5 text-center">Stock</th>
                <th className="px-4 py-3.5">Satuan</th>
                <th className="px-4 py-3.5 text-center">Stock Min</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Nilai Stock</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedBarang.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package className="w-10 h-10" />
                      <span className="text-sm font-semibold">Tidak ada data stok ditemukan</span>
                      <span className="text-xs">Ubah parameter pencarian atau filter Anda</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBarang.map((b, idx) => {
                const status = getStatusStok(b.stock, b.stock_minimum)
                const no = (currentPage - 1) * pageSize + idx + 1
                const itemNilai = b.stock * b.harga
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-semibold">{no}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-[11px]">{b.kode_barang}</td>
                    <td className="px-4 py-3.5 font-semibold max-w-[200px] truncate">{b.nama_barang}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.kategori?.nama || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.merk || '-'}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{b.stock}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.satuan}</td>
                    <td className="px-4 py-3.5 text-center text-slate-400 font-semibold">{b.stock_minimum}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatRupiah(itemNilai)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedItem(b)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Lihat Detail Stok"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/barang`)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Barang"
                        >
                          <Pencil className="w-3.5 h-3.5" />
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] text-slate-400 font-semibold">
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredBarang.length)}–{Math.min(currentPage * pageSize, filteredBarang.length)} dari {filteredBarang.length} data
            </span>
            
            <div className="flex items-center gap-3">
              {/* Page size controller */}
              <div className="flex items-center gap-1">
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1) }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-500"
                >
                  <option value={10}>10 / halaman</option>
                  <option value={25}>25 / halaman</option>
                  <option value={50}>50 / halaman</option>
                </select>
              </div>

              {/* Prev Next */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page = i + 1
                  if (totalPages > 5) {
                    if (currentPage <= 3) page = i + 1
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                    else page = currentPage - 2 + i
                  }
                  return (
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
                  )
                })}
                {totalPages > 5 && <span className="text-slate-400 text-xs px-1">...</span>}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Detail Informasi Stok</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Kode Barang</span>
                  <span className="font-mono font-bold text-blue-600">{selectedItem.kode_barang}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Nama Barang</span>
                  <span className="font-bold text-slate-800 text-right">{selectedItem.nama_barang}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Kategori</span>
                  <span className="font-bold text-slate-800">{selectedItem.kategori?.nama || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Merk</span>
                  <span className="font-bold text-slate-800">{selectedItem.merk || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Tipe / Spesifikasi</span>
                  <span className="font-bold text-slate-800 text-right">{selectedItem.tipe_spesifikasi || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Stok Saat Ini</span>
                  <span className="font-extrabold text-slate-800 text-lg">{selectedItem.stock} {selectedItem.satuan}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Stok Minimum</span>
                  <span className="font-bold text-slate-600">{selectedItem.stock_minimum} {selectedItem.satuan}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Harga Satuan</span>
                  <span className="font-bold text-slate-800">{formatRupiah(selectedItem.harga)}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Total Nilai Aset</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{formatRupiah(selectedItem.stock * selectedItem.harga)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedItem(null)}
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
