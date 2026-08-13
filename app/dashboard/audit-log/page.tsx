'use client'

import { useMemo, useState } from 'react'
import {
  Search, Filter, RotateCcw, Eye, X, ChevronLeft, ChevronRight,
  FileSpreadsheet, History, CheckCircle, Info
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================
type Role = 'superadmin' | 'admin' | 'staff'
type AksiLog = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'
type StatusLog = 'BERHASIL' | 'GAGAL'

interface AuditLog {
  id: string
  tanggal: string // format: YYYY-MM-DD
  waktu: string // format: HH:MM:SS
  user: string
  role: Role
  model: string
  aksi: AksiLog
  detail: string
  ip: string
  status: StatusLog
}

interface FilterState {
  tanggal_dari: string
  tanggal_sampai: string
  cari: string
  user: string
  aksi: string
  model: string
  status: string
}

// ============================================================
// DUMMY DATA
// Catatan: data ini hanya untuk keperluan pengembangan UI.
// TODO: ganti dengan fetch dari Supabase (tabel audit_log)
// ============================================================
const MODEL_LIST = ['Barang', 'Kategori', 'Barang Masuk', 'Barang Keluar', 'Permintaan', 'User', 'Autentikasi']
const AKSI_LIST: AksiLog[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT']
const STATUS_LIST: StatusLog[] = ['BERHASIL', 'GAGAL']
const PAGE_SIZE = 10
const FILTER_AWAL: FilterState = { tanggal_dari: '', tanggal_sampai: '', cari: '', user: '', aksi: '', model: '', status: '' }

// Warna badge aksi
const AKSI_STYLE: Record<AksiLog, string> = {
  CREATE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  UPDATE: 'bg-blue-50 text-blue-600 border-blue-100',
  DELETE: 'bg-rose-50 text-rose-600 border-rose-100',
  LOGIN: 'bg-sky-50 text-sky-600 border-sky-100',
  LOGOUT: 'bg-slate-100 text-slate-500 border-slate-200',
  EXPORT: 'bg-purple-50 text-purple-600 border-purple-100',
}

// Warna badge role
const ROLE_STYLE: Record<Role, string> = {
  superadmin: 'bg-purple-50 border-purple-100 text-purple-600',
  admin: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  staff: 'bg-amber-50 border-amber-100 text-amber-600',
}

const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin IT',
  staff: 'Staff IT',
}

// Warna badge status
const STATUS_STYLE: Record<StatusLog, string> = {
  BERHASIL: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  GAGAL: 'bg-rose-50 text-rose-600 border-rose-100',
}

const DATA_AUDIT_LOG: AuditLog[] = [
  { id: '1', tanggal: '2026-07-28', waktu: '09:42:15', user: 'Super Admin IT', role: 'superadmin', model: 'Barang', aksi: 'CREATE', detail: 'Menambahkan barang baru: Laptop Dell Latitude 5440 (BRG-IT-0001).', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '2', tanggal: '2026-07-28', waktu: '09:41:58', user: 'Super Admin IT', role: 'superadmin', model: 'Barang Masuk', aksi: 'CREATE', detail: 'Mencatat transaksi barang masuk BM-2026-0001 (8 unit, Rp 51.500.000).', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '3', tanggal: '2026-07-28', waktu: '08:15:02', user: 'Admin IT', role: 'admin', model: 'Autentikasi', aksi: 'LOGIN', detail: 'Login berhasil menggunakan email admin.it@pelindo.co.id.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '4', tanggal: '2026-07-27', waktu: '16:30:44', user: 'Admin IT', role: 'admin', model: 'Permintaan', aksi: 'UPDATE', detail: 'Menyetujui permintaan PR-2026-0001 dari Budi Santoso.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '5', tanggal: '2026-07-27', waktu: '15:12:30', user: 'Staff IT', role: 'staff', model: 'Autentikasi', aksi: 'LOGIN', detail: 'Login berhasil menggunakan email staff.it@pelindo.co.id.', ip: '192.168.1.102', status: 'BERHASIL' },
  { id: '6', tanggal: '2026-07-27', waktu: '14:05:19', user: 'Admin IT', role: 'admin', model: 'Barang Keluar', aksi: 'CREATE', detail: 'Mencatat transaksi barang keluar BK-2026-0001 (5 unit, tujuan Divisi SDM).', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '7', tanggal: '2026-07-27', waktu: '11:47:55', user: 'Staff IT', role: 'staff', model: 'Autentikasi', aksi: 'LOGIN', detail: 'Percobaan login gagal: password salah (3x percobaan).', ip: '192.168.1.77', status: 'GAGAL' },
  { id: '8', tanggal: '2026-07-26', waktu: '16:58:12', user: 'Super Admin IT', role: 'superadmin', model: 'Kategori', aksi: 'UPDATE', detail: 'Mengubah nama kategori: Toner & Cartridge menjadi Tinta & Toner.', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '9', tanggal: '2026-07-26', waktu: '13:20:36', user: 'Admin IT', role: 'admin', model: 'Barang', aksi: 'UPDATE', detail: 'Memperbarui stok minimum barang Mouse Wireless Logitech M185 menjadi 8.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '10', tanggal: '2026-07-26', waktu: '10:03:51', user: 'Staff IT', role: 'staff', model: 'Permintaan', aksi: 'CREATE', detail: 'Mengajukan permintaan baru PR-2026-0002 (toner printer HRD).', ip: '192.168.1.102', status: 'BERHASIL' },
  { id: '11', tanggal: '2026-07-25', waktu: '17:11:05', user: 'Super Admin IT', role: 'superadmin', model: 'User', aksi: 'CREATE', detail: 'Menambahkan user baru: budi.santoso@pelindo.co.id (role Staff IT).', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '12', tanggal: '2026-07-25', waktu: '15:44:29', user: 'Super Admin IT', role: 'superadmin', model: 'User', aksi: 'DELETE', detail: 'Menghapus user: rina.old@pelindo.co.id (akun tidak aktif).', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '13', tanggal: '2026-07-25', waktu: '09:22:40', user: 'Admin IT', role: 'admin', model: 'Barang Masuk', aksi: 'EXPORT', detail: 'Mengexport laporan barang masuk periode Mei–Juli 2026.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '14', tanggal: '2026-07-24', waktu: '16:40:18', user: 'Admin IT', role: 'admin', model: 'Kategori', aksi: 'CREATE', detail: 'Menambahkan kategori baru: Perangkat Jaringan.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '15', tanggal: '2026-07-24', waktu: '14:12:07', user: 'Staff IT', role: 'staff', model: 'Barang', aksi: 'UPDATE', detail: 'Percobaan mengubah harga barang ditolak: akses tidak diizinkan.', ip: '192.168.1.102', status: 'GAGAL' },
  { id: '16', tanggal: '2026-07-23', waktu: '17:33:52', user: 'Admin IT', role: 'admin', model: 'Barang Keluar', aksi: 'CREATE', detail: 'Mencatat transaksi barang keluar BK-2026-0004 (10 unit, tujuan Divisi Operasi).', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '17', tanggal: '2026-07-23', waktu: '13:05:26', user: 'Super Admin IT', role: 'superadmin', model: 'Autentikasi', aksi: 'LOGIN', detail: 'Login berhasil menggunakan email superadmin@pelindo.co.id.', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '18', tanggal: '2026-07-22', waktu: '15:58:33', user: 'Super Admin IT', role: 'superadmin', model: 'Barang', aksi: 'DELETE', detail: 'Menghapus barang: PC Pentium 4 (BRG-IT-0001) - data usang.', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '19', tanggal: '2026-07-22', waktu: '10:26:41', user: 'Admin IT', role: 'admin', model: 'Autentikasi', aksi: 'LOGOUT', detail: 'Logout dari sistem.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '20', tanggal: '2026-07-21', waktu: '16:47:09', user: 'Staff IT', role: 'staff', model: 'Permintaan', aksi: 'CREATE', detail: 'Mengajukan permintaan baru PR-2026-0003 (SSD untuk upgrade).', ip: '192.168.1.102', status: 'BERHASIL' },
  { id: '21', tanggal: '2026-07-21', waktu: '11:19:54', user: 'Admin IT', role: 'admin', model: 'Barang', aksi: 'CREATE', detail: 'Menambahkan barang baru: Access Point TP-Link EAP225 (BRG-IT-0016).', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '22', tanggal: '2026-07-18', waktu: '15:37:28', user: 'Admin IT', role: 'admin', model: 'Permintaan', aksi: 'UPDATE', detail: 'Menolak permintaan PR-2026-0004: melebihi anggaran divisi.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '23', tanggal: '2026-07-18', waktu: '09:04:15', user: 'Staff IT', role: 'staff', model: 'Autentikasi', aksi: 'LOGIN', detail: 'Percobaan login dengan akun tidak dikenal.', ip: '192.168.1.210', status: 'GAGAL' },
  { id: '24', tanggal: '2026-07-15', waktu: '14:52:33', user: 'Super Admin IT', role: 'superadmin', model: 'Barang Masuk', aksi: 'EXPORT', detail: 'Mengexport laporan barang masuk Juni 2026.', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '25', tanggal: '2026-07-15', waktu: '10:38:46', user: 'Admin IT', role: 'admin', model: 'Kategori', aksi: 'DELETE', detail: 'Menghapus kategori: Peralatan Lama (tidak digunakan).', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '26', tanggal: '2026-07-14', waktu: '16:20:12', user: 'Staff IT', role: 'staff', model: 'Autentikasi', aksi: 'LOGOUT', detail: 'Logout dari sistem.', ip: '192.168.1.102', status: 'BERHASIL' },
  { id: '27', tanggal: '2026-07-13', waktu: '13:44:08', user: 'Super Admin IT', role: 'superadmin', model: 'User', aksi: 'UPDATE', detail: 'Mengubah role user: dewi.lestari@pelindo.co.id menjadi Admin IT.', ip: '192.168.1.25', status: 'BERHASIL' },
  { id: '28', tanggal: '2026-07-12', waktu: '09:15:37', user: 'Admin IT', role: 'admin', model: 'Barang Keluar', aksi: 'EXPORT', detail: 'Mengexport laporan barang keluar bulan Juni 2026.', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '29', tanggal: '2026-07-10', waktu: '16:55:21', user: 'Admin IT', role: 'admin', model: 'Barang', aksi: 'UPDATE', detail: 'Menonaktifkan barang: PC Pentium 4 (BRG-IT-0001).', ip: '192.168.1.48', status: 'BERHASIL' },
  { id: '30', tanggal: '2026-07-08', waktu: '11:02:49', user: 'Super Admin IT', role: 'superadmin', model: 'Autentikasi', aksi: 'LOGOUT', detail: 'Logout dari sistem.', ip: '192.168.1.25', status: 'BERHASIL' },
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
      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-600 cursor-pointer min-w-[140px]"
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
export default function AuditLogPage() {
  // Filter aktif (dipakai untuk memfilter tabel)
  const [filter, setFilter] = useState<FilterState>(FILTER_AWAL)
  // Draft filter (nilai input, diterapkan saat tombol Filter diklik)
  const [draft, setDraft] = useState<FilterState>(FILTER_AWAL)
  const [currentPage, setCurrentPage] = useState(1)
  const [detail, setDetail] = useState<AuditLog | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (pesan: string) => {
    setToast(pesan)
    setTimeout(() => setToast(null), 3500)
  }

  // Daftar user unik untuk dropdown (diambil dari data)
  const userList = useMemo(() => Array.from(new Set(DATA_AUDIT_LOG.map(d => d.user))), [])

  // Filter data berdasarkan kriteria aktif
  const filtered = useMemo(() => {
    return DATA_AUDIT_LOG.filter(item => {
      const matchTanggal = (!filter.tanggal_dari || item.tanggal >= filter.tanggal_dari) &&
        (!filter.tanggal_sampai || item.tanggal <= filter.tanggal_sampai)
      const matchCari = !filter.cari ||
        item.detail.toLowerCase().includes(filter.cari.toLowerCase()) ||
        item.ip.toLowerCase().includes(filter.cari.toLowerCase())
      const matchUser = !filter.user || item.user === filter.user
      const matchAksi = !filter.aksi || item.aksi === filter.aksi
      const matchModel = !filter.model || item.model === filter.model
      const matchStatus = !filter.status || item.status === filter.status
      return matchTanggal && matchCari && matchUser && matchAksi && matchModel && matchStatus
    })
  }, [filter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
      `${formatTanggal(d.tanggal)} ${d.waktu}`, d.user, ROLE_LABEL[d.role], d.model,
      d.aksi, d.detail, d.ip, d.status,
    ])
    exportCsv('audit-log.csv', ['Tanggal & Waktu', 'User', 'Role', 'Model', 'Aksi', 'Detail', 'IP Address', 'Status'], rows)
    showToast('File Excel berhasil diunduh.')
  }

  return (
    <div className="space-y-6 font-sans text-slate-800">

      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Pengaturan</span>
            <span>›</span>
            <span className="text-slate-600">Audit Log</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Audit Log</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Monitor semua aktivitas perubahan data di sistem.</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Aktivitas
        </button>
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
            placeholder="Cari detail aktivitas atau IP..."
          />
          <FieldSelect
            value={draft.user}
            onChange={v => setDraft(d => ({ ...d, user: v }))}
            options={userList}
            placeholder="Semua User"
          />
          <FieldSelect
            value={draft.aksi}
            onChange={v => setDraft(d => ({ ...d, aksi: v }))}
            options={AKSI_LIST}
            placeholder="Semua Aksi"
          />
          <FieldSelect
            value={draft.model}
            onChange={v => setDraft(d => ({ ...d, model: v }))}
            options={MODEL_LIST}
            placeholder="Semua Model"
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

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3.5">No</th>
                <th className="px-4 py-3.5">Tanggal & Waktu</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Model</th>
                <th className="px-4 py-3.5">Aksi</th>
                <th className="px-4 py-3.5 max-w-[200px]">Detail</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <History className="w-10 h-10" />
                      <span className="text-sm font-semibold">Belum ada data aktivitas</span>
                      <span className="text-xs">Coba ubah filter atau reset pencarian Anda.</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 text-slate-400 font-semibold">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="font-semibold text-slate-700">{formatTanggal(d.tanggal)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{d.waktu} WIB</p>
                  </td>
                  <td className="px-4 py-3.5 font-semibold">{d.user}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${ROLE_STYLE[d.role]}`}>
                      {ROLE_LABEL[d.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{d.model}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${AKSI_STYLE[d.aksi]}`}>
                      {d.aksi}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">{d.detail}</td>
                  <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{d.ip}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_STYLE[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
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
                <h2 className="font-extrabold text-slate-900 text-base">Detail Aktivitas</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{formatTanggal(detail.tanggal)} · {detail.waktu} WIB</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Isi panel */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <section>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Info Aktivitas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Tanggal" value={formatTanggal(detail.tanggal)} />
                  <InfoRow label="Waktu" value={`${detail.waktu} WIB`} />
                  <InfoRow label="User" value={detail.user} />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Role</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold border ${ROLE_STYLE[detail.role]}`}>
                      {ROLE_LABEL[detail.role]}
                    </span>
                  </div>
                  <InfoRow label="Model" value={detail.model} />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Aksi</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${AKSI_STYLE[detail.aksi]}`}>
                      {detail.aksi}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Status</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${STATUS_STYLE[detail.status]}`}>
                      {detail.status}
                    </span>
                  </div>
                  <div>
                    <InfoRow label="IP Address" value={detail.ip} />
                  </div>
                  <div className="col-span-2">
                    <InfoRow label="Detail" value={detail.detail} />
                  </div>
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