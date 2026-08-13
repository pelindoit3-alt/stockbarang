'use client'

import { useMemo, useState } from 'react'
import {
  Search, Filter, RotateCcw, Eye, X, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Printer, ArrowUpRight, CheckCircle2, XCircle, Clock,
  CheckCircle, Package, Info
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================
type StatusKeluar = 'DISETUJUI' | 'DITOLAK' | 'PENDING'

interface BarangKeluarItem {
  kode_barang: string
  nama_barang: string
  satuan: string
  qty: number
}

interface BarangKeluar {
  id: string
  no_transaksi: string
  tanggal: string // format: YYYY-MM-DD
  tujuan: string
  kategori: string
  total_item: number
  total_qty: number
  keterangan: string
  status: StatusKeluar
  detail: BarangKeluarItem[]
}

interface FilterState {
  tanggal_dari: string
  tanggal_sampai: string
  cari: string
  kategori: string
  tujuan: string
}

// ============================================================
// DUMMY DATA
// Catatan: data ini hanya untuk keperluan pengembangan UI.
// TODO: ganti dengan fetch dari Supabase (tabel barang_keluar)
// ============================================================
const KATEGORI_LIST = ['Perangkat', 'Sparepart', 'Toner & Cartridge', 'Aksesoris', 'Networking', 'Lainnya']
const TUJUAN_LIST = ['Divisi IT', 'Divisi SDM', 'Divisi Keuangan', 'Divisi Operasi', 'Divisi Teknik', 'Divisi Umum']
const PAGE_SIZE = 10
const FILTER_AWAL: FilterState = { tanggal_dari: '', tanggal_sampai: '', cari: '', kategori: '', tujuan: '' }

// Warna badge status
const STATUS_STYLE: Record<StatusKeluar, string> = {
  DISETUJUI: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  DITOLAK: 'bg-rose-50 text-rose-600 border-rose-100',
  PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
}

const DATA_BARANG_KELUAR: BarangKeluar[] = [
  {
    id: '1', no_transaksi: 'BK-2026-0001', tanggal: '2026-07-28', tujuan: 'Divisi SDM', kategori: 'Aksesoris',
    total_item: 2, total_qty: 5, keterangan: 'Penggantian mouse & keyboard rusak', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0011', nama_barang: 'Mouse Wireless Logitech M185', satuan: 'Pcs', qty: 3 },
      { kode_barang: 'BRG-IT-0012', nama_barang: 'Keyboard Logitech K120', satuan: 'Pcs', qty: 2 },
    ],
  },
  {
    id: '2', no_transaksi: 'BK-2026-0002', tanggal: '2026-07-26', tujuan: 'Divisi Keuangan', kategori: 'Toner & Cartridge',
    total_item: 1, total_qty: 4, keterangan: 'Toner printer divisi keuangan', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0009', nama_barang: 'Toner HP 26A', satuan: 'Pcs', qty: 4 },
    ],
  },
  {
    id: '3', no_transaksi: 'BK-2026-0003', tanggal: '2026-07-24', tujuan: 'Divisi IT', kategori: 'Sparepart',
    total_item: 2, total_qty: 6, keterangan: 'Pemeliharaan PC kantor', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0005', nama_barang: 'SSD Samsung 870 EVO 500GB', satuan: 'Pcs', qty: 4 },
      { kode_barang: 'BRG-IT-0006', nama_barang: 'RAM 16GB DDR4', satuan: 'Pcs', qty: 2 },
    ],
  },
  {
    id: '4', no_transaksi: 'BK-2026-0004', tanggal: '2026-07-22', tujuan: 'Divisi Operasi', kategori: 'Networking',
    total_item: 1, total_qty: 10, keterangan: 'Instalasi jaringan lantai 3', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0014', nama_barang: 'Kabel UTP Cat6', satuan: 'Roll', qty: 10 },
    ],
  },
  {
    id: '5', no_transaksi: 'BK-2026-0005', tanggal: '2026-07-20', tujuan: 'Divisi Teknik', kategori: 'Perangkat',
    total_item: 1, total_qty: 1, keterangan: 'Pengadaan PC workstation', status: 'PENDING',
    detail: [
      { kode_barang: 'BRG-IT-0003', nama_barang: 'PC Workstation Dell Precision', satuan: 'Unit', qty: 1 },
    ],
  },
  {
    id: '6', no_transaksi: 'BK-2026-0006', tanggal: '2026-07-18', tujuan: 'Divisi Umum', kategori: 'Aksesoris',
    total_item: 2, total_qty: 8, keterangan: 'Kebutuhan ATK IT', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0011', nama_barang: 'Mouse Wireless Logitech M185', satuan: 'Pcs', qty: 5 },
      { kode_barang: 'BRG-IT-0012', nama_barang: 'Keyboard Logitech K120', satuan: 'Pcs', qty: 3 },
    ],
  },
  {
    id: '7', no_transaksi: 'BK-2026-0007', tanggal: '2026-07-15', tujuan: 'Divisi SDM', kategori: 'Perangkat',
    total_item: 1, total_qty: 1, keterangan: 'Laptop karyawan baru', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0001', nama_barang: 'Laptop Dell Latitude 5440', satuan: 'Unit', qty: 1 },
    ],
  },
  {
    id: '8', no_transaksi: 'BK-2026-0008', tanggal: '2026-07-12', tujuan: 'Divisi Keuangan', kategori: 'Sparepart',
    total_item: 1, total_qty: 2, keterangan: 'Penggantian RAM', status: 'DITOLAK',
    detail: [
      { kode_barang: 'BRG-IT-0021', nama_barang: 'RAM 8GB DDR3', satuan: 'Pcs', qty: 2 },
    ],
  },
  {
    id: '9', no_transaksi: 'BK-2026-0009', tanggal: '2026-07-10', tujuan: 'Divisi IT', kategori: 'Toner & Cartridge',
    total_item: 1, total_qty: 6, keterangan: 'Stok rutin toner', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0010', nama_barang: 'Toner HP 05A', satuan: 'Pcs', qty: 6 },
    ],
  },
  {
    id: '10', no_transaksi: 'BK-2026-0010', tanggal: '2026-07-08', tujuan: 'Divisi Operasi', kategori: 'Aksesoris',
    total_item: 1, total_qty: 3, keterangan: 'Headset call center', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0013', nama_barang: 'Headset Jabra Evolve 20', satuan: 'Unit', qty: 3 },
    ],
  },
  {
    id: '11', no_transaksi: 'BK-2026-0011', tanggal: '2026-07-05', tujuan: 'Divisi Teknik', kategori: 'Networking',
    total_item: 2, total_qty: 4, keterangan: 'Perbaikan jaringan workshop', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0016', nama_barang: 'Access Point TP-Link EAP225', satuan: 'Unit', qty: 2 },
      { kode_barang: 'BRG-IT-0015', nama_barang: 'Switch Cisco 24 Port', satuan: 'Unit', qty: 2 },
    ],
  },
  {
    id: '12', no_transaksi: 'BK-2026-0012', tanggal: '2026-07-02', tujuan: 'Divisi Umum', kategori: 'Sparepart',
    total_item: 1, total_qty: 1, keterangan: 'Adaptor charger rusak', status: 'PENDING',
    detail: [
      { kode_barang: 'BRG-IT-0028', nama_barang: 'Adaptor Charger 65W', satuan: 'Pcs', qty: 1 },
    ],
  },
  {
    id: '13', no_transaksi: 'BK-2026-0013', tanggal: '2026-06-29', tujuan: 'Divisi SDM', kategori: 'Aksesoris',
    total_item: 1, total_qty: 2, keterangan: 'Webcam meeting online', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0019', nama_barang: 'Webcam Logitech C920', satuan: 'Unit', qty: 2 },
    ],
  },
  {
    id: '14', no_transaksi: 'BK-2026-0014', tanggal: '2026-06-26', tujuan: 'Divisi Keuangan', kategori: 'Perangkat',
    total_item: 1, total_qty: 2, keterangan: 'Monitor tambahan', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0002', nama_barang: 'Monitor Dell P2422H', satuan: 'Unit', qty: 2 },
    ],
  },
  {
    id: '15', no_transaksi: 'BK-2026-0015', tanggal: '2026-06-23', tujuan: 'Divisi IT', kategori: 'Sparepart',
    total_item: 2, total_qty: 5, keterangan: 'Upgrade SSD PC', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0022', nama_barang: 'SSD 240GB Kingston', satuan: 'Pcs', qty: 3 },
      { kode_barang: 'BRG-IT-0005', nama_barang: 'SSD Samsung 870 EVO 500GB', satuan: 'Pcs', qty: 2 },
    ],
  },
  {
    id: '16', no_transaksi: 'BK-2026-0016', tanggal: '2026-06-20', tujuan: 'Divisi Operasi', kategori: 'Toner & Cartridge',
    total_item: 1, total_qty: 3, keterangan: 'Tinta printer operasional', status: 'DITOLAK',
    detail: [
      { kode_barang: 'BRG-IT-0023', nama_barang: 'Tinta Epson 664', satuan: 'Set', qty: 3 },
    ],
  },
  {
    id: '17', no_transaksi: 'BK-2026-0017', tanggal: '2026-06-17', tujuan: 'Divisi Teknik', kategori: 'Aksesoris',
    total_item: 1, total_qty: 4, keterangan: 'USB hub & kabel', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0020', nama_barang: 'USB Hub 4 Port', satuan: 'Pcs', qty: 4 },
    ],
  },
  {
    id: '18', no_transaksi: 'BK-2026-0018', tanggal: '2026-06-13', tujuan: 'Divisi Umum', kategori: 'Networking',
    total_item: 1, total_qty: 2, keterangan: 'Switch kantor umum', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0015', nama_barang: 'Switch Cisco 24 Port', satuan: 'Unit', qty: 2 },
    ],
  },
  {
    id: '19', no_transaksi: 'BK-2026-0019', tanggal: '2026-06-10', tujuan: 'Divisi SDM', kategori: 'Perangkat',
    total_item: 1, total_qty: 1, keterangan: 'PC HRD baru', status: 'PENDING',
    detail: [
      { kode_barang: 'BRG-IT-0003', nama_barang: 'PC Workstation Dell Precision', satuan: 'Unit', qty: 1 },
    ],
  },
  {
    id: '20', no_transaksi: 'BK-2026-0020', tanggal: '2026-06-06', tujuan: 'Divisi IT', kategori: 'Aksesoris',
    total_item: 2, total_qty: 6, keterangan: 'Keyboard & mouse cadangan', status: 'DISETUJUI',
    detail: [
      { kode_barang: 'BRG-IT-0011', nama_barang: 'Mouse Wireless Logitech M185', satuan: 'Pcs', qty: 4 },
      { kode_barang: 'BRG-IT-0012', nama_barang: 'Keyboard Logitech K120', satuan: 'Pcs', qty: 2 },
    ],
  },
]

// ============================================================
// HELPERS
// ============================================================
const formatTanggal = (iso: string) => {
  const [tahun, bulan, hari] = iso.split('-')
  return `${hari}/${bulan}/${tahun}`
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

function FieldDate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-600 cursor-pointer"
    />
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
export default function LaporanBarangKeluarPage() {
  // Filter aktif (dipakai untuk memfilter tabel)
  const [filter, setFilter] = useState<FilterState>(FILTER_AWAL)
  // Draft filter (nilai input, diterapkan saat tombol Filter diklik)
  const [draft, setDraft] = useState<FilterState>(FILTER_AWAL)
  const [currentPage, setCurrentPage] = useState(1)
  const [detail, setDetail] = useState<BarangKeluar | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (pesan: string) => {
    setToast(pesan)
    setTimeout(() => setToast(null), 3500)
  }

  // Filter data berdasarkan kriteria aktif
  const filtered = useMemo(() => {
    return DATA_BARANG_KELUAR.filter(item => {
      const matchTanggal = (!filter.tanggal_dari || item.tanggal >= filter.tanggal_dari) &&
        (!filter.tanggal_sampai || item.tanggal <= filter.tanggal_sampai)
      const matchCari = !filter.cari ||
        item.no_transaksi.toLowerCase().includes(filter.cari.toLowerCase()) ||
        item.tujuan.toLowerCase().includes(filter.cari.toLowerCase())
      const matchKategori = !filter.kategori || item.kategori === filter.kategori
      const matchTujuan = !filter.tujuan || item.tujuan === filter.tujuan
      return matchTanggal && matchCari && matchKategori && matchTujuan
    })
  }, [filter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Ringkasan statistik (berubah mengikuti hasil filter)
  const stats = useMemo(() => {
    const hitung = (status: StatusKeluar) => filtered.filter(d => d.status === status).length
    return { total: filtered.length, disetujui: hitung('DISETUJUI'), ditolak: hitung('DITOLAK'), pending: hitung('PENDING') }
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
      d.no_transaksi, formatTanggal(d.tanggal), d.tujuan, d.kategori,
      String(d.total_item), String(d.total_qty), d.keterangan, d.status,
    ])
    exportCsv('laporan-barang-keluar.csv', ['No. Transaksi', 'Tanggal', 'Tujuan', 'Kategori', 'Total Item', 'Total Qty', 'Keterangan', 'Status'], rows)
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
            <span className="text-slate-600">Barang Keluar</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Laporan Barang Keluar</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Rekap seluruh transaksi barang keluar Divisi IT.</p>
        </div>
        <ExportButtons onExcel={handleExportExcel} onPdf={handleExportPdf} onCetak={handleCetak} />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FieldDate value={draft.tanggal_dari} onChange={v => setDraft(d => ({ ...d, tanggal_dari: v }))} />
            <span className="text-xs text-slate-400 font-semibold">s/d</span>
            <FieldDate value={draft.tanggal_sampai} onChange={v => setDraft(d => ({ ...d, tanggal_sampai: v }))} />
          </div>
          <FieldSearch
            value={draft.cari}
            onChange={v => setDraft(d => ({ ...d, cari: v }))}
            placeholder="Cari no. transaksi atau tujuan..."
          />
          <FieldSelect
            value={draft.kategori}
            onChange={v => setDraft(d => ({ ...d, kategori: v }))}
            options={KATEGORI_LIST}
            placeholder="Semua Kategori"
          />
          <FieldSelect
            value={draft.tujuan}
            onChange={v => setDraft(d => ({ ...d, tujuan: v }))}
            options={TUJUAN_LIST}
            placeholder="Semua Tujuan"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ArrowUpRight} label="TOTAL BARANG KELUAR" value={String(stats.total)} sub="Transaksi tercatat" iconClass="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle2} label="DISETUJUI" value={String(stats.disetujui)} sub="Transaksi disetujui" iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard icon={XCircle} label="DITOLAK" value={String(stats.ditolak)} sub="Transaksi ditolak" iconClass="bg-rose-50 text-rose-600" />
        <StatCard icon={Clock} label="PENDING" value={String(stats.pending)} sub="Menunggu persetujuan" iconClass="bg-amber-50 text-amber-600" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3.5">No</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">No. Transaksi</th>
                <th className="px-4 py-3.5">Tujuan / Divisi</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5 text-center">Total Item</th>
                <th className="px-4 py-3.5 text-center">Total Qty</th>
                <th className="px-4 py-3.5 max-w-[160px]">Keterangan</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package className="w-10 h-10" />
                      <span className="text-sm font-semibold">Belum ada data barang keluar</span>
                      <span className="text-xs">Coba ubah filter atau reset pencarian Anda.</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 text-slate-400 font-semibold">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-500">{formatTanggal(d.tanggal)}</td>
                  <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-[11px]">{d.no_transaksi}</td>
                  <td className="px-4 py-3.5 font-semibold">{d.tujuan}</td>
                  <td className="px-4 py-3.5 text-slate-500">{d.kategori}</td>
                  <td className="px-4 py-3.5 text-center font-semibold">{d.total_item}</td>
                  <td className="px-4 py-3.5 text-center font-semibold">{d.total_qty}</td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[160px] truncate">{d.keterangan}</td>
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
              ))}
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
                <h2 className="font-extrabold text-slate-900 text-base">Detail Transaksi</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 font-mono">{detail.no_transaksi}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Isi panel */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Info transaksi */}
              <section>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Info Transaksi
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Tanggal" value={formatTanggal(detail.tanggal)} />
                  <InfoRow label="Tujuan / Divisi" value={detail.tujuan} />
                  <InfoRow label="Kategori" value={detail.kategori} />
                  <InfoRow label="Total Item" value={`${detail.total_item} jenis barang`} />
                  <InfoRow label="Total Qty" value={`${detail.total_qty} unit`} />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Status</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_STYLE[detail.status]}`}>
                      {detail.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <InfoRow label="Keterangan" value={detail.keterangan} />
                  </div>
                </div>
              </section>

              {/* Daftar item */}
              <section>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Daftar Item
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-3 py-2.5">Barang</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.detail.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2.5">
                            <p className="font-bold text-slate-800">{item.nama_barang}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.kode_barang} · {item.satuan}</p>
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/70">
                        <td className="px-3 py-2.5 font-bold text-slate-600">Total</td>
                        <td className="px-3 py-2.5 text-center font-extrabold">{detail.total_qty}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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