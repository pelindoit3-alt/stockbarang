'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Tags, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { createKategori, deleteKategori } from './actions'

interface Kategori {
  id: string
  nama: string
  deskripsi: string
  created_at: string
  barang_count?: number
}

interface Props {
  initialKategori: Kategori[]
  canManage: boolean
}

export default function KategoriClient({ initialKategori, canManage }: Props) {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text })
    setTimeout(() => setAlert(null), 4000)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await createKategori(nama, deskripsi)
    setLoading(false)
    if (result.error) { showAlert('error', result.error); return }
    setNama(''); setDeskripsi('')
    showAlert('success', 'Kategori berhasil ditambahkan!')
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeleteId(null)
    const result = await deleteKategori(id)
    if (result.error) { showAlert('error', result.error); return }
    showAlert('success', 'Kategori berhasil dihapus.')
    router.refresh()
  }

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
          <span>Master Data</span><span>›</span>
          <span className="text-slate-600">Kategori</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Data Kategori</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola kategori untuk pengelompokan barang inventaris.</p>
      </div>

      {alert && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold animate-slide-in ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Tambah */}
        {canManage && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <Plus className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-sm text-slate-900">Tambah Kategori</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Nama Kategori <span className="text-rose-500">*</span></label>
                <input
                  type="text" required
                  placeholder="Contoh: Perangkat"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Deskripsi</label>
                <textarea
                  placeholder="Deskripsi kategori (opsional)"
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Tambah Kategori</span>
              </button>
            </form>
          </div>
        )}

        {/* Tabel Kategori */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${canManage ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Tags className="w-4 h-4 text-purple-500" />
            <h2 className="font-extrabold text-sm text-slate-900">Daftar Kategori</h2>
            <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md">{initialKategori.length} Kategori</span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-5 py-3.5">No</th>
                <th className="px-5 py-3.5">Nama Kategori</th>
                <th className="px-5 py-3.5">Deskripsi</th>
                <th className="px-5 py-3.5">Dibuat</th>
                {canManage && <th className="px-5 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {initialKategori.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-xs">Belum ada kategori</td></tr>
              ) : initialKategori.map((k, i) => (
                <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{k.nama}</td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-[200px] truncate">{k.deskripsi || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-400">{new Date(k.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  {canManage && (
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setDeleteId(k.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Konfirmasi hapus */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6 animate-slide-in">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-extrabold text-slate-900">Hapus Kategori?</h3>
              <p className="text-xs text-slate-400">Barang yang terhubung kategori ini akan kehilangan referensi kategorinya.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
