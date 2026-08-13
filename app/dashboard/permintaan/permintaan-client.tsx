'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, RotateCcw, Eye, Check, X,
  Loader2, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, FileSpreadsheet,
  Send, ArrowRight
} from 'lucide-react'
import { createPermintaan, approvePermintaan, rejectPermintaan, cancelPermintaan, prosesBarangKeluar } from './actions'

interface Barang { id: string; nama_barang: string; stock: number; satuan: string }
interface Permintaan {
  id: string; nomor: string; tanggal: string;
  pemohon_id: string; pemohon_nama: string;
  barang_id: string; barang: { nama_barang: string; stock: number } | null;
  jumlah: number; keperluan: string; keterangan: string; status: string;
  alasan_penolakan: string; approved_by_name: string; created_at: string;
}
interface Props { initialData: Permintaan[]; barangList: Barang[]; userId: string; userRole: string }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'PENDING',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  APPROVED:   { label: 'APPROVED',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PROCESSING: { label: 'PROCESSING', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  COMPLETED:  { label: 'COMPLETED',  color: 'bg-teal-100 text-teal-700 border-teal-200' },
  REJECTED:   { label: 'REJECTED',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  CANCELLED:  { label: 'CANCELLED',  color: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const PAGE_SIZE = 10

export default function PermintaanClient({ initialData, barangList, userId, userRole }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<Permintaan | null>(null)
  const [rejectInput, setRejectInput] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  // Form
  const [form, setForm] = useState({ barang_id: '', jumlah: 1, keperluan: '', keterangan: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text })
    setTimeout(() => setAlert(null), 4000)
  }

  const isAdmin = ['superadmin', 'admin'].includes(userRole)

  // Filter
  const filtered = useMemo(() => {
    return initialData.filter(p => {
      const matchSearch = !search || [p.nomor, p.pemohon_nama, p.barang?.nama_barang || '', p.keperluan]
        .join(' ').toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || p.status === filterStatus
      const tgl = p.tanggal.split('T')[0]
      const matchFrom = !filterFrom || tgl >= filterFrom
      const matchTo = !filterTo || tgl <= filterTo
      return matchSearch && matchStatus && matchFrom && matchTo
    })
  }, [initialData, search, filterStatus, filterFrom, filterTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Submit tambah permintaan
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.barang_id) { setFormError('Pilih barang terlebih dahulu.'); return }
    if (form.jumlah < 1) { setFormError('Jumlah minimal 1.'); return }
    if (!form.keperluan.trim()) { setFormError('Keperluan wajib diisi.'); return }
    setFormLoading(true); setFormError(null)
    const result = await createPermintaan(form)
    setFormLoading(false)
    if (result.error) { setFormError(result.error); return }
    setAddModalOpen(false)
    setForm({ barang_id: '', jumlah: 1, keperluan: '', keterangan: '' })
    showAlert('success', 'Permintaan berhasil diajukan!')
    router.refresh()
  }

  // Approve
  const handleApprove = async (id: string) => {
    setActionLoading(true)
    const result = await approvePermintaan(id)
    setActionLoading(false)
    if (result.error) { showAlert('error', result.error); return }
    showAlert('success', 'Permintaan berhasil disetujui!')
    setDetailItem(null); router.refresh()
  }

  // Reject
  const handleReject = async (id: string) => {
    if (!rejectInput.trim()) { showAlert('error', 'Alasan penolakan wajib diisi.'); return }
    setActionLoading(true)
    const result = await rejectPermintaan(id, rejectInput)
    setActionLoading(false)
    if (result.error) { showAlert('error', result.error); return }
    showAlert('success', 'Permintaan berhasil ditolak.')
    setDetailItem(null); setRejectInput(''); setShowRejectForm(false); router.refresh()
  }

  // Proses Barang Keluar
  const handleProses = async (id: string) => {
    setActionLoading(true)
    const result = await prosesBarangKeluar(id)
    setActionLoading(false)
    if (result.error) { showAlert('error', result.error); return }
    showAlert('success', 'Barang keluar berhasil diproses! Status menjadi COMPLETED.')
    setDetailItem(null); router.refresh()
  }

  const selectedBarang = barangList.find(b => b.id === form.barang_id)

  const formatDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const formatDateTime = (s: string) => new Date(s).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6 font-sans text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Transaksi</span><span>›</span><span className="text-slate-600">Permintaan Barang</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Data Permintaan Barang</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola permintaan barang dari Staff IT.</p>
        </div>
        <button onClick={() => { setAddModalOpen(true); setFormError(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0">
          <Plus className="w-4 h-4" /><span>+ Permintaan Baru</span>
        </button>
      </div>

      {alert && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold animate-slide-in ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari nomor, pemohon, barang..."
              value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400" />
          </div>
          <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer" />
          <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer" />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer min-w-[130px]">
            <option value="">Semua Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setCurrentPage(1) }}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 transition-all cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" /><span>Reset</span>
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
                <th className="px-4 py-3.5">Nomor</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Pemohon</th>
                <th className="px-4 py-3.5">Barang</th>
                <th className="px-4 py-3.5 text-center">Jumlah</th>
                <th className="px-4 py-3.5">Keperluan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileSpreadsheet className="w-10 h-10" />
                    <span className="text-sm font-semibold">Belum ada permintaan barang</span>
                  </div>
                </td></tr>
              ) : paginated.map((p, idx) => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING
                const no = (currentPage - 1) * PAGE_SIZE + idx + 1
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-semibold">{no}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-[11px]">{p.nomor}</td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(p.tanggal)}</td>
                    <td className="px-4 py-3.5 font-semibold">{p.pemohon_nama}</td>
                    <td className="px-4 py-3.5 max-w-[140px] truncate">{p.barang?.nama_barang || '-'}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{p.jumlah}</td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[160px] truncate">{p.keperluan}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${sc.color}`}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Detail */}
                        <button onClick={() => { setDetailItem(p); setShowRejectForm(false); setRejectInput('') }}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Lihat detail">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {/* Approve (admin only, PENDING) */}
                        {isAdmin && p.status === 'PENDING' && (
                          <button onClick={() => handleApprove(p.id)}
                            className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Setujui">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Reject (admin only, PENDING) */}
                        {isAdmin && p.status === 'PENDING' && (
                          <button onClick={() => { setDetailItem(p); setShowRejectForm(true) }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="Tolak">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] text-slate-400 font-semibold">
              Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} data
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  {page}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-400 text-xs px-1">...</span>}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ MODAL TAMBAH PERMINTAAN ============ */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Permintaan Barang Baru</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Nomor permintaan dibuat otomatis</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
                </div>
              )}
              <form id="perm-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Barang <span className="text-rose-500">*</span></label>
                  <select value={form.barang_id} onChange={e => setForm(f => ({ ...f, barang_id: e.target.value }))} required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer">
                    <option value="">-- Pilih Barang --</option>
                    {barangList.map(b => (
                      <option key={b.id} value={b.id}>{b.nama_barang} (Stok: {b.stock} {b.satuan})</option>
                    ))}
                  </select>
                  {selectedBarang && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
                      Stock Tersedia: <span className={`font-extrabold ${selectedBarang.stock === 0 ? 'text-rose-600' : selectedBarang.stock < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{selectedBarang.stock} {selectedBarang.satuan}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Jumlah <span className="text-rose-500">*</span></label>
                  <input type="number" min={1} required value={form.jumlah}
                    onChange={e => setForm(f => ({ ...f, jumlah: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Keperluan <span className="text-rose-500">*</span></label>
                  <input type="text" required placeholder="Contoh: Upgrade PC Staff Helpdesk" value={form.keperluan}
                    onChange={e => setForm(f => ({ ...f, keperluan: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Keterangan</label>
                  <textarea placeholder="Keterangan tambahan (opsional)" value={form.keterangan} rows={3}
                    onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none" />
                </div>
              </form>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button onClick={() => setAddModalOpen(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Batal</button>
              <button type="submit" form="perm-form" disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Ajukan Permintaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL DETAIL / AKSI ============ */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="font-extrabold text-slate-900 text-base">Detail Permintaan</h2>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${STATUS_CONFIG[detailItem.status]?.color}`}>
                  {STATUS_CONFIG[detailItem.status]?.label}
                </span>
              </div>
              <button onClick={() => { setDetailItem(null); setShowRejectForm(false); setRejectInput('') }} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs">
                {[
                  ['Nomor Permintaan', detailItem.nomor],
                  ['Tanggal', formatDateTime(detailItem.tanggal)],
                  ['Pemohon', detailItem.pemohon_nama],
                  ['Barang', detailItem.barang?.nama_barang || '-'],
                  ['Jumlah', `${detailItem.jumlah}`],
                  ['Stock Saat Ini', `${detailItem.barang?.stock ?? '-'}`],
                  ['Keperluan', detailItem.keperluan],
                  ['Keterangan', detailItem.keterangan || '-'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-slate-400 font-semibold w-36 shrink-0">{k}</span>
                    <span className="font-bold text-slate-700">: {v}</span>
                  </div>
                ))}
                {detailItem.alasan_penolakan && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-semibold w-36 shrink-0">Alasan Tolak</span>
                    <span className="font-bold text-rose-600">: {detailItem.alasan_penolakan}</span>
                  </div>
                )}
              </div>

              {/* Tindakan (admin only, status PENDING) */}
              {isAdmin && detailItem.status === 'PENDING' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tindakan</h3>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(detailItem.id)} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Setujui</span>
                    </button>
                    <button onClick={() => setShowRejectForm(!showRejectForm)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer">
                      <X className="w-4 h-4" /><span>Tolak</span>
                    </button>
                  </div>

                  {showRejectForm && (
                    <div className="space-y-2 p-4 bg-rose-50 rounded-xl border border-rose-100">
                      <label className="text-[11px] font-bold text-rose-600">Alasan Penolakan <span>*</span></label>
                      <textarea value={rejectInput} onChange={e => setRejectInput(e.target.value)} rows={3}
                        placeholder="Masukkan alasan penolakan"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-600/20 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowRejectForm(false)} className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                        <button onClick={() => handleReject(detailItem.id)} disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                          {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Kirim Alasan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Proses Barang Keluar (admin only, status APPROVED) */}
              {isAdmin && detailItem.status === 'APPROVED' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Setujui Permintaan</h3>
                  <p className="text-xs text-slate-400">Setelah disetujui, permintaan dapat diproses menjadi transaksi barang keluar.</p>
                  <button onClick={() => handleProses(detailItem.id)} disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>Proses Barang Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
