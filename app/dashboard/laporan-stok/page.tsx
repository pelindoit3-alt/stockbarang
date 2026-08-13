'use client'

import { useMemo, useState } from 'react'
import {
  Search, Filter, RotateCcw, Eye, X, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Printer, Database, TrendingUp, AlertTriangle, XCircle,
  Banknote, CheckCircle, ArrowDownLeft, ArrowUpRight, Info
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================
type StatusStok = 'AMAN' | 'MENIPIS' | 'HABIS'

interface RiwayatStok {
  tipe: 'masuk' | 'keluar'
  tanggal: string // format: YYYY-MM-DD
  no_transaksi: string
  qty: number
}

interface BarangStok {
  id: string
  kode_barang: string
  nama_barang: string
  merk: string
  kategori: string
  satuan: string
  stock: number
  stock_minimum: number
  harga: number // harga per satuan
  riwayat: RiwayatStok[]
}

interface FilterState {
  cari: string
  kategori: string
  satuan: string
  status: string
}

// ============================================================
// DUMMY DATA
// Catatan: data ini hanya untuk keperluan pengembangan UI.
// TODO: ganti dengan fetch dari Supabase (tabel barang + stok)
// ============================================================
const KATEGORI_LIST = ['Perangkat', 'Sparepart', 'Toner & Cartridge', 'Aksesoris', 'Networking', 'Lainnya']
const SATUAN_LIST = ['Unit', 'Pcs', 'Set', 'Box', 'Lusin', 'Rim', 'Buah', 'Pasang', 'Roll', 'Meter', 'Liter']
const STATUS_LIST = ['AMAN', 'MENIPIS', 'HABIS']
const PAGE_SIZE = 10
const FILTER_AWAL: FilterState = { cari: '', kategori: '', satuan: '', status: '' }

const DATA_BARANG_STOK: BarangStok[] = [
  {
    id: '1', kode_barang: 'BRG-IT-0001', nama_barang: 'Laptop Dell Latitude 5440', merk: 'Dell', kategori: 'Perangkat', satuan: 'Unit',
    stock: 12, stock_minimum: 3, harga: 12500000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-28', no_transaksi: 'BM-2026-0001', qty: 3 },
      { tipe: 'keluar', tanggal: '2026-07-15', no_transaksi: 'BK-2026-0007', qty: 1 },
    ],
  },
  {
    id: '2', kode_barang: 'BRG-IT-0002', nama_barang: 'Monitor Dell P2422H', merk: 'Dell', kategori: 'Perangkat', satuan: 'Unit',
    stock: 15, stock_minimum: 4, harga: 2800000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-28', no_transaksi: 'BM-2026-0001', qty: 5 },
      { tipe: 'keluar', tanggal: '2026-06-26', no_transaksi: 'BK-2026-0014', qty: 2 },
    ],
  },
  {
    id: '3', kode_barang: 'BRG-IT-0003', nama_barang: 'PC Workstation Dell Precision', merk: 'Dell', kategori: 'Perangkat', satuan: 'Unit',
    stock: 3, stock_minimum: 2, harga: 28000000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-10', no_transaksi: 'BM-2026-0006', qty: 2 },
      { tipe: 'keluar', tanggal: '2026-07-20', no_transaksi: 'BK-2026-0005', qty: 1 },
    ],
  },
  {
    id: '4', kode_barang: 'BRG-IT-0004', nama_barang: 'UPS APC 1000VA', merk: 'APC', kategori: 'Perangkat', satuan: 'Unit',
    stock: 6, stock_minimum: 2, harga: 3200000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-06-20', no_transaksi: 'BM-2026-0011', qty: 5 },
    ],
  },
  {
    id: '5', kode_barang: 'BRG-IT-0005', nama_barang: 'SSD Samsung 870 EVO 500GB', merk: 'Samsung', kategori: 'Sparepart', satuan: 'Pcs',
    stock: 18, stock_minimum: 5, harga: 1150000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-15', no_transaksi: 'BM-2026-0005', qty: 15 },
      { tipe: 'keluar', tanggal: '2026-07-24', no_transaksi: 'BK-2026-0003', qty: 4 },
      { tipe: 'keluar', tanggal: '2026-06-23', no_transaksi: 'BK-2026-0015', qty: 2 },
    ],
  },
  {
    id: '6', kode_barang: 'BRG-IT-0006', nama_barang: 'RAM 16GB DDR4', merk: 'Kingston', kategori: 'Sparepart', satuan: 'Pcs',
    stock: 12, stock_minimum: 4, harga: 850000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-15', no_transaksi: 'BM-2026-0005', qty: 10 },
      { tipe: 'keluar', tanggal: '2026-07-24', no_transaksi: 'BK-2026-0003', qty: 2 },
    ],
  },
  {
    id: '7', kode_barang: 'BRG-IT-0007', nama_barang: 'Hardisk Seagate 2TB', merk: 'Seagate', kategori: 'Sparepart', satuan: 'Pcs',
    stock: 2, stock_minimum: 4, harga: 1450000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-06-28', no_transaksi: 'BM-2026-0009', qty: 6 },
      { tipe: 'keluar', tanggal: '2026-07-01', no_transaksi: 'BK-2026-0021', qty: 4 },
    ],
  },
  {
    id: '8', kode_barang: 'BRG-IT-0008', nama_barang: 'Baterai Laptop Dell', merk: 'Dell', kategori: 'Sparepart', satuan: 'Pcs',
    stock: 0, stock_minimum: 2, harga: 750000,
    riwayat: [
      { tipe: 'keluar', tanggal: '2026-07-19', no_transaksi: 'BK-2026-0022', qty: 2 },
    ],
  },
  {
    id: '9', kode_barang: 'BRG-IT-0009', nama_barang: 'Toner HP 26A', merk: 'HP', kategori: 'Toner & Cartridge', satuan: 'Pcs',
    stock: 14, stock_minimum: 6, harga: 850000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-25', no_transaksi: 'BM-2026-0002', qty: 10 },
      { tipe: 'keluar', tanggal: '2026-07-26', no_transaksi: 'BK-2026-0002', qty: 4 },
    ],
  },
  {
    id: '10', kode_barang: 'BRG-IT-0010', nama_barang: 'Toner HP 05A', merk: 'HP', kategori: 'Toner & Cartridge', satuan: 'Pcs',
    stock: 1, stock_minimum: 5, harga: 680000,
    riwayat: [
      { tipe: 'keluar', tanggal: '2026-07-10', no_transaksi: 'BK-2026-0009', qty: 6 },
    ],
  },
  {
    id: '11', kode_barang: 'BRG-IT-0011', nama_barang: 'Mouse Wireless Logitech M185', merk: 'Logitech', kategori: 'Aksesoris', satuan: 'Pcs',
    stock: 28, stock_minimum: 8, harga: 165000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-22', no_transaksi: 'BM-2026-0003', qty: 25 },
      { tipe: 'keluar', tanggal: '2026-07-28', no_transaksi: 'BK-2026-0001', qty: 3 },
      { tipe: 'keluar', tanggal: '2026-07-18', no_transaksi: 'BK-2026-0006', qty: 5 },
    ],
  },
  {
    id: '12', kode_barang: 'BRG-IT-0012', nama_barang: 'Keyboard Logitech K120', merk: 'Logitech', kategori: 'Aksesoris', satuan: 'Pcs',
    stock: 0, stock_minimum: 6, harga: 145000,
    riwayat: [
      { tipe: 'keluar', tanggal: '2026-07-28', no_transaksi: 'BK-2026-0001', qty: 2 },
    ],
  },
  {
    id: '13', kode_barang: 'BRG-IT-0013', nama_barang: 'Headset Jabra Evolve 20', merk: 'Jabra', kategori: 'Aksesoris', satuan: 'Unit',
    stock: 9, stock_minimum: 3, harga: 780000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-07', no_transaksi: 'BM-2026-0007', qty: 8 },
      { tipe: 'keluar', tanggal: '2026-07-08', no_transaksi: 'BK-2026-0010', qty: 3 },
    ],
  },
  {
    id: '14', kode_barang: 'BRG-IT-0014', nama_barang: 'Kabel UTP Cat6', merk: 'Belden', kategori: 'Networking', satuan: 'Roll',
    stock: 5, stock_minimum: 3, harga: 950000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-18', no_transaksi: 'BM-2026-0004', qty: 10 },
      { tipe: 'keluar', tanggal: '2026-07-22', no_transaksi: 'BK-2026-0004', qty: 10 },
    ],
  },
  {
    id: '15', kode_barang: 'BRG-IT-0015', nama_barang: 'Switch Cisco 24 Port', merk: 'Cisco', kategori: 'Networking', satuan: 'Unit',
    stock: 4, stock_minimum: 2, harga: 4500000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-07-18', no_transaksi: 'BM-2026-0004', qty: 2 },
      { tipe: 'keluar', tanggal: '2026-06-13', no_transaksi: 'BK-2026-0018', qty: 2 },
    ],
  },
  {
    id: '16', kode_barang: 'BRG-IT-0016', nama_barang: 'Access Point TP-Link EAP225', merk: 'TP-Link', kategori: 'Networking', satuan: 'Unit',
    stock: 2, stock_minimum: 3, harga: 1250000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-06-24', no_transaksi: 'BM-2026-0010', qty: 6 },
      { tipe: 'keluar', tanggal: '2026-07-05', no_transaksi: 'BK-2026-0011', qty: 2 },
      { tipe: 'keluar', tanggal: '2026-07-11', no_transaksi: 'BK-2026-0023', qty: 2 },
    ],
  },
  {
    id: '17', kode_barang: 'BRG-IT-0032', nama_barang: 'Label Printer Brother QL-820', merk: 'Brother', kategori: 'Lainnya', satuan: 'Unit',
    stock: 3, stock_minimum: 1, harga: 2500000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-05-13', no_transaksi: 'BM-2026-0020', qty: 3 },
    ],
  },
  {
    id: '18', kode_barang: 'BRG-IT-0023', nama_barang: 'Tinta Epson 664', merk: 'Epson', kategori: 'Toner & Cartridge', satuan: 'Set',
    stock: 25, stock_minimum: 10, harga: 115000,
    riwayat: [
      { tipe: 'masuk', tanggal: '2026-06-08', no_transaksi: 'BM-2026-0014', qty: 30 },
      { tipe: 'keluar', tanggal: '2026-06-20', no_transaksi: 'BK-2026-0016', qty: 3 },
    ],
  },
]

// ============================================================
// HELPERS
// ============================================================
const formatRupiah = (nilai: number) => `Rp ${nilai.toLocaleString('id-ID')}`

const formatTanggal = (iso: string) => {
  const [tahun, bulan, hari] = iso.split('-')
  return `${hari}/${bulan}/${tahun}`
}

// Hitung status stok berdasarkan stock & stock minimum
function getStatusStok(stock: number, stockMin: number): StatusStok {
  if (stock === 0) return 'HABIS'
  if (stock <= stockMin) return 'MENIPIS'
  return 'AMAN'
}

// Warna badge status stok
const STATUS_STYLE: Record<StatusStok, string> = {
  AMAN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MENIPIS: 'bg-amber-100 text-amber-700 border-amber-200',
  HABIS: 'bg-rose-100 text-rose-700 border-rose-200',
}

// Export data ke file CSV (dapat dibuka dengan Excel)
const exportCsv = (namaFile: string, headers: string[], rows: string[][]) => {
  const isi = [headers, ...rows]
    .map(baris => baris.map(kolom => `"${String(kolom).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['\ufeff' + isi], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = namaFile
  link.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  iconClass: string // contoh: 'bg-blue-50 text-blue-600'
}

function StatCard({ icon: Icon, label, value, sub, iconClass }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider block">{label}</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1 truncate">{value}</h3>
          {sub && <span className="text-[10px] text-slate-400 font-semibold">{sub}</span>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

function PaginationBar({ currentPage, totalPages, totalItems, onPageChange }: PaginationBarProps) {
  if (totalItems === 0) return null

  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, totalItems)

  const pages: number[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 5; i++) pages.push(i)
  } else if (currentPage >= totalPages - 2) {
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
  } else {
    for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 bg-slate-50/50">
      <span className="text-[11px] text-slate-400 font-semibold">
        Menampilkan {start}–{end} dari {totalItems} data
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              currentPage === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}
        {totalPages > 5 && currentPage < totalPages - 2 && <span className="text-slate-400 text-xs px-1">...</span>}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

interface ExportButtonsProps {
  onExcel: () => void
  onPdf: () => void
  onCetak: () => void
}

function ExportButtons({ onExcel, onPdf, onCetak }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <button
        onClick={onExcel}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Export Excel
      </button>
      <button
        onClick={onPdf}
        className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
      >
        <FileText className="w-4 h-4" />
        Export PDF
      </button>
      <button
        onClick={onCetak}
        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        Cetak
      </button>
    </div>
  )
}

function FieldSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
      />
    </div>
  )
}

function FieldSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-600 cursor-pointer min-w-[150px]"
    >
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
      <p className="text-xs font-bold text-slate-800 mt-0.5 break-words">{value}</p>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function LaporanStockPage() {
  // Filter aktif (dipakai untuk memfilter tabel)
  const [filter, setFilter] = useState<FilterState>(FILTER_AWAL)
  // Draft filter (nilai input, diterapkan saat tombol Filter diklik)
  const [draft, setDraft] = useState<FilterState>(FILTER_AWAL)
  const [currentPage, setCurrentPage] = useState(1)
  const [detail, setDetail] = useState<BarangStok | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (pesan: string) => {
    setToast(pesan)
    setTimeout(() => setToast(null), 3500)
  }

  // Filter data berdasarkan kriteria aktif
  const filtered = useMemo(() => {
    return DATA_BARANG_STOK.filter(item => {
      const status = getStatusStok(item.stock, item.stock_minimum)
      const matchCari = !filter.cari ||
        [item.kode_barang, item.nama_barang, item.merk].join(' ').toLowerCase().includes(filter.cari.toLowerCase())
      const matchKategori = !filter.kategori || item.kategori === filter.kategori
      const matchSatuan = !filter.satuan || item.satuan === filter.satuan
      const matchStatus = !filter.status || status === filter.status
      return matchCari && matchKategori && matchSatuan && matchStatus
    })
  }, [filter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Ringkasan statistik (berubah mengikuti hasil filter)
  const stats = useMemo(() => {
    const totalStock = filtered.reduce((sum, d) => sum + d.stock, 0)
    const totalNilai = filtered.reduce((sum, d) => sum + (d.stock * d.harga), 0)
    const menipis = filtered.filter(d => getStatusStok(d.stock, d.stock_minimum) === 'MENIPIS').length
    const habis = filtered.filter(d => getStatusStok(d.stock, d.stock_minimum) === 'HABIS').length
    return {
      totalStock,
      rataRata: filtered.length > 0 ? Math.round(totalStock / filtered.length) : 0,
      menipis,
      habis,
      totalNilai,
    }
  }, [filtered])

  const applyFilter = () => {
    setFilter(draft)
    setCurrentPage(1)
  }

  const resetFilter = () => {
    setFilter(FILTER_AWAL)
    setDraft(FILTER_AWAL)
    setCurrentPage(1)
  }

  // ---------- EXPORT ----------
  const handleExportExcel = () => {
    const rows = filtered.map(d => [
      d.kode_barang, d.nama_barang, d.kategori, d.satuan,
      String(d.stock), String(d.stock_minimum), getStatusStok(d.stock, d.stock_minimum), formatRupiah(d.stock * d.harga),
    ])
    exportCsv('laporan-stock.csv', ['Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Stok', 'Stok Min', 'Status', 'Nilai Rupiah'], rows)
    showToast('File Excel berhasil diunduh.')
  }

  const handleExportPdf = () => showToast('Fitur Export PDF akan diintegrasikan setelah backend tersedia.')

  const handleCetak = () => showToast('Fitur Cetak akan diintegrasikan setelah backend tersedia.')

  return (
    <div className="space-y-6 font-sans text-slate-800">

      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Laporan</span>
            <span>›</span>
            <span className="text-slate-600">Stock</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Laporan Stock</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Rekap stok barang beserta nilai rupiah seluruh inventaris Divisi IT.</p>
        </div>
        <ExportButtons onExcel={handleExportExcel} onPdf={handleExportPdf} onCetak={handleCetak} />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
          <FieldSearch
            value={draft.cari}
            onChange={v => setDraft(d => ({ ...d, cari: v }))}
            placeholder="Cari kode, nama barang, atau merk..."
          />
          <FieldSelect
            value={draft.kategori}
            onChange={v => setDraft(d => ({ ...d, kategori: v }))}
            options={KATEGORI_LIST}
            placeholder="Semua Kategori"
          />
          <FieldSelect
            value={draft.satuan}
            onChange={v => setDraft(d => ({ ...d, satuan: v }))}
            options={SATUAN_LIST}
            placeholder="Semua Satuan"
          />
          <FieldSelect
            value={draft.status}
            onChange={v => setDraft(d => ({ ...d, status: v }))}
            options={STATUS_LIST}
            placeholder="Semua Status"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={applyFilter}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <button
              onClick={resetFilter}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Database} label="TOTAL STOK" value={String(stats.totalStock)} sub="Semua unit stok" iconClass="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="RATA-RATA STOK" value={String(stats.rataRata)} sub="Per jenis barang" iconClass="bg-purple-50 text-purple-600" />
        <StatCard icon={AlertTriangle} label="STOK MENIPIS" value={String(stats.menipis)} sub="Perlu perhatian" iconClass="bg-amber-50 text-amber-600" />
        <StatCard icon={XCircle} label="BARANG HABIS" value={String(stats.habis)} sub="Segera restock" iconClass="bg-rose-50 text-rose-600" />
        <StatCard icon={Banknote} label="TOTAL NILAI RUPIAH" value={formatRupiah(stats.totalNilai)} sub="Nilai keseluruhan" iconClass="bg-emerald-50 text-emerald-600" />
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
                <th className="px-4 py-3.5 text-center">Stok</th>
                <th className="px-4 py-3.5 text-center">Stok Min.</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Nilai Rupiah</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Database className="w-10 h-10" />
                      <span className="text-sm font-semibold">Belum ada data stock</span>
                      <span className="text-xs">Coba ubah filter atau reset pencarian Anda.</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((d, idx) => {
                const status = getStatusStok(d.stock, d.stock_minimum)
                return (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-semibold">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-[11px]">{d.kode_barang}</td>
                    <td className="px-4 py-3.5 font-semibold max-w-[180px] truncate">{d.nama_barang}</td>
                    <td className="px-4 py-3.5 text-slate-500">{d.kategori}</td>
                    <td className="px-4 py-3.5 text-slate-500">{d.satuan}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{d.stock}</td>
                    <td className="px-4 py-3.5 text-center text-slate-400 font-semibold">{d.stock_minimum}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_STYLE[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-800">{formatRupiah(d.stock * d.harga)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setDetail(d)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Lihat detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* DETAIL SLIDE PANEL */}
      {detail && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setDetail(null)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
            {/* Header panel */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Laporan Stok</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 font-mono">{detail.kode_barang}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Isi panel */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Info barang */}
              <section>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Info Barang
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <InfoRow label="Nama Barang" value={detail.nama_barang} />
                  </div>
                  <InfoRow label="Kategori" value={detail.kategori} />
                  <InfoRow label="Satuan" value={detail.satuan} />
                  <InfoRow label="Stok" value={`${detail.stock} ${detail.satuan}`} />
                  <InfoRow label="Stok Minimum" value={`${detail.stock_minimum} ${detail.satuan}`} />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Status</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_STYLE[getStatusStok(detail.stock, detail.stock_minimum)]}`}>
                      {getStatusStok(detail.stock, detail.stock_minimum)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <InfoRow label="Nilai Rupiah" value={formatRupiah(detail.stock * detail.harga)} />
                  </div>
                </div>
              </section>

              {/* Riwayat masuk/keluar */}
              <section>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Riwayat Masuk / Keluar
                </h3>
                {detail.riwayat.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">Belum ada riwayat transaksi untuk barang ini.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="px-3 py-2.5">Tipe</th>
                          <th className="px-3 py-2.5">Tanggal</th>
                          <th className="px-3 py-2.5">No. Transaksi</th>
                          <th className="px-3 py-2.5 text-center">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.riwayat.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2.5">
                              {r.tipe === 'masuk' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold">
                                  <ArrowDownLeft className="w-3 h-3" /> MASUK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-bold">
                                  <ArrowUpRight className="w-3 h-3" /> KELUAR
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">{formatTanggal(r.tanggal)}</td>
                            <td className="px-3 py-2.5 font-mono text-[10px] font-bold text-blue-600">{r.no_transaksi}</td>
                            <td className="px-3 py-2.5 text-center font-semibold">{r.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </aside>
        </>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl animate-slide-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  )
}