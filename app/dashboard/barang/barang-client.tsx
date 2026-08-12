'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, RotateCcw, Pencil, Trash2,
  Loader2, X, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Package
} from 'lucide-react'
import { createBarang, updateBarang, toggleBarangActive, deleteBarang } from './actions'

// ============================================================
// TYPES
// ============================================================
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
  initialBarang: Barang[]
  kategoriList: Kategori[]
  userRole: string
}

// ============================================================
// HELPER: Hitung Status Stok
// ============================================================
function getStatusStok(stock: number, stockMin: number) {
  if (stock === 0) return { label: 'HABIS', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  if (stock <= stockMin) return { label: 'MENIPIS', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'AMAN', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

// ============================================================
// SATUAN OPTIONS
// ============================================================
const SATUAN_OPTIONS = ['Unit', 'Pcs', 'Set', 'Box', 'Lusin', 'Rim', 'Buah', 'Pasang', 'Roll', 'Meter', 'Liter']

const PAGE_SIZE = 10

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BarangClient({ initialBarang, kategoriList, userRole }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Data state (optimistic update via revalidatePath)
  const [barangList, setBarangList] = useState<Barang[]>(initialBarang)

  // Filters
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null)

  // Alert
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const emptyForm = {
    nama_barang: '', kategori_id: '', merk: '',
    tipe_spesifikasi: '', satuan: 'Unit',
    stock: 0, stock_minimum: 0, is_active: true
  }
  const [form, setForm] = useState(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ============================================================
  // FILTER + SEARCH + PAGINATION
  // ============================================================
  const filtered = useMemo(() => {
    return barangList.filter(b => {
      const matchSearch = !search || [b.kode_barang, b.nama_barang, b.merk]
        .join(' ').toLowerCase().includes(search.toLowerCase())
      const matchKat = !filterKategori || b.kategori_id === filterKategori
      const status = getStatusStok(b.stock, b.stock_minimum).label
      const matchStatus = !filterStatus || status === filterStatus
      return matchSearch && matchKat && matchStatus
    })
  }, [barangList, search, filterKategori, filterStatus])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text })
    setTimeout(() => setAlertMsg(null), 4000)
  }

  // ============================================================
  // OPEN MODAL
  // ============================================================
  const openAddModal = () => {
    setEditingBarang(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (b: Barang) => {
    setEditingBarang(b)
    setForm({
      nama_barang: b.nama_barang,
      kategori_id: b.kategori_id || '',
      merk: b.merk,
      tipe_spesifikasi: b.tipe_spesifikasi,
      satuan: b.satuan,
      stock: b.stock,
      stock_minimum: b.stock_minimum,
      is_active: b.is_active,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingBarang(null)
    setFormError(null)
  }

  // ============================================================
  // SUBMIT FORM
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama_barang.trim()) {
      setFormError('Nama barang wajib diisi.')
      return
    }
    setFormLoading(true)
    setFormError(null)

    const result = editingBarang
      ? await updateBarang(editingBarang.id, form)
      : await createBarang(form)

    if (result.error) {
      setFormError(result.error)
      setFormLoading(false)
      return
    }

    setFormLoading(false)
    closeModal()
    showAlert('success', editingBarang ? 'Data barang berhasil diperbarui!' : 'Barang baru berhasil ditambahkan!')
    router.refresh()
  }

  // ============================================================
  // TOGGLE ACTIVE
  // ============================================================
  const handleToggle = async (b: Barang) => {
    // Optimistic update
    setBarangList(prev => prev.map(item =>
      item.id === b.id ? { ...item, is_active: !item.is_active } : item
    ))
    startTransition(async () => {
      const result = await toggleBarangActive(b.id, !b.is_active)
      if (result.error) {
        // Revert
        setBarangList(prev => prev.map(item =>
          item.id === b.id ? { ...item, is_active: b.is_active } : item
        ))
        showAlert('error', result.error)
      }
    })
  }

  // ============================================================
  // DELETE
  // ============================================================
  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null)
    const result = await deleteBarang(id)
    if (result.error) {
      showAlert('error', result.error)
      return
    }
    setBarangList(prev => prev.filter(b => b.id !== id))
    showAlert('success', 'Barang berhasil dihapus.')
  }

  const canManage = ['superadmin', 'admin'].includes(userRole)

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 font-sans text-slate-800">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Master Data</span>
            <span>›</span>
            <span className="text-slate-600">Barang</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Data Barang</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola master data barang inventaris Divisi IT.</p>
        </div>
        {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Barang</span>
          </button>
        )}
      </div>

      {/* ALERTS */}
      {alertMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold animate-slide-in ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          {alertMsg.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* SEARCH + FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama barang, atau merk..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
            />
          </div>
          {/* Filter Kategori */}
          <select
            value={filterKategori}
            onChange={e => { setFilterKategori(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-600 cursor-pointer min-w-[140px]"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-600 cursor-pointer min-w-[130px]"
          >
            <option value="">Semua Status</option>
            <option value="AMAN">AMAN</option>
            <option value="MENIPIS">MENIPIS</option>
            <option value="HABIS">HABIS</option>
          </select>
          {/* Reset */}
          <button
            onClick={() => { setSearch(''); setFilterKategori(''); setFilterStatus(''); setCurrentPage(1) }}
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
                <th className="px-4 py-3.5">Merk</th>
                <th className="px-4 py-3.5">Tipe / Spesifikasi</th>
                <th className="px-4 py-3.5">Satuan</th>
                <th className="px-4 py-3.5 text-center">Stock</th>
                <th className="px-4 py-3.5 text-center">Stock Min</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package className="w-10 h-10" />
                      <span className="text-sm font-semibold">Belum ada data barang</span>
                      <span className="text-xs">Klik "+ Tambah Barang" untuk menambahkan barang pertama</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((b, idx) => {
                const status = getStatusStok(b.stock, b.stock_minimum)
                const no = (currentPage - 1) * PAGE_SIZE + idx + 1
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-semibold">{no}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-[11px]">{b.kode_barang}</td>
                    <td className="px-4 py-3.5 font-semibold max-w-[180px] truncate">{b.nama_barang}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.kategori?.nama || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.merk || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-[160px] truncate">{b.tipe_spesifikasi || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.satuan}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{b.stock}</td>
                    <td className="px-4 py-3.5 text-center text-slate-400 font-semibold">{b.stock_minimum}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {canManage ? (
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Edit barang"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(b.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(b)}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${b.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}
                            title={b.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${b.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className={`w-2 h-2 rounded-full ${b.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] text-slate-400 font-semibold">
              Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} data
            </span>
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
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {totalPages}
                </button>
              )}
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

      {/* ============================================================
          MODAL TAMBAH / EDIT BARANG
      ============================================================ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  {editingBarang ? 'Edit Data Barang' : 'Tambah Barang Baru'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {editingBarang ? `Mengubah: ${editingBarang.kode_barang}` : 'Kode barang akan dibuat otomatis'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="barang-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Nama Barang */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Nama Barang <span className="text-rose-500">*</span></label>
                    <input
                      type="text" required
                      placeholder="Masukkan nama barang"
                      value={form.nama_barang}
                      onChange={e => setForm(f => ({ ...f, nama_barang: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Kategori */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Kategori</label>
                    <select
                      value={form.kategori_id}
                      onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {kategoriList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* Merk */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Merk / Brand</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dell, Samsung, HP"
                      value={form.merk}
                      onChange={e => setForm(f => ({ ...f, merk: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Tipe / Spesifikasi */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Tipe / Spesifikasi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Intel i5 / 16GB / 512GB SSD"
                      value={form.tipe_spesifikasi}
                      onChange={e => setForm(f => ({ ...f, tipe_spesifikasi: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Satuan */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Satuan <span className="text-rose-500">*</span></label>
                    <select
                      value={form.satuan}
                      onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer"
                    >
                      {SATUAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Stock Awal <span className="text-rose-500">*</span></label>
                    <input
                      type="number" required min={0}
                      placeholder="0"
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Stock Minimum */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Stock Minimum <span className="text-rose-500">*</span></label>
                    <input
                      type="number" required min={0}
                      placeholder="0"
                      value={form.stock_minimum}
                      onChange={e => setForm(f => ({ ...f, stock_minimum: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                    <p className="text-[10px] text-slate-400">Barang akan berstatus MENIPIS jika stock ≤ nilai ini</p>
                  </div>

                  {/* Status Aktif */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Status Aktif</label>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${form.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-xs font-semibold ${form.is_active ? 'text-blue-600' : 'text-slate-400'}`}>
                        {form.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>

                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="barang-form"
                disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{editingBarang ? 'Simpan Perubahan' : 'Tambah Barang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL KONFIRMASI HAPUS
      ============================================================ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6 animate-slide-in">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Barang?</h3>
              <p className="text-xs text-slate-400 font-medium">
                Data barang ini akan dihapus permanen dari database dan tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
