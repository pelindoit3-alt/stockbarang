'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser, deleteUser } from './actions'
import { 
  UserPlus, 
  Trash2, 
  Mail, 
  User, 
  Lock, 
  ShieldCheck, 
  ShieldAlert,
  Loader2, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'staff'
  full_name: string
  created_at: string
}

interface UserManagementClientProps {
  initialProfiles: Profile[]
  currentUserId: string
}

export default function UserManagementClient({ initialProfiles, currentUserId }: UserManagementClientProps) {
  const router = useRouter()

  // Form State
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')
  const [password, setPassword] = useState('')
  
  // UI Status State
  const [loading, setLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Handlers
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !fullName || !role || !password) {
      setErrorMsg('Semua kolom input formulir wajib diisi.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal harus terdiri dari 6 karakter.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await createUser({ email, fullName, role, password })

    if (result.error) {
      setErrorMsg(result.error)
      setLoading(false)
    } else {
      setSuccessMsg(`User "${fullName}" dengan role "${role}" berhasil ditambahkan!`)
      // Reset form
      setEmail('')
      setFullName('')
      setRole('staff')
      setPassword('')
      setLoading(false)
      
      // Refresh Next.js server data
      router.refresh()
      
      // Clear alert after 5s
      setTimeout(() => setSuccessMsg(null), 5000)
    }
  }

  const handleDeleteUser = async (targetUserId: string, name: string) => {
    if (targetUserId === currentUserId) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus user "${name}"? Tindakan ini permanen.`)) {
      return
    }

    setDeleteLoadingId(targetUserId)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await deleteUser(targetUserId)

    if (result.error) {
      setErrorMsg(result.error)
      setDeleteLoadingId(null)
    } else {
      setSuccessMsg(`User "${name}" berhasil dihapus dari sistem.`)
      setDeleteLoadingId(null)
      router.refresh()
      setTimeout(() => setSuccessMsg(null), 5000)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Manajemen User</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Tambahkan dan kelola hak akses pengguna divisi IT (Superadmin, Admin, Staff).
        </p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-slide-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Add User Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Tambah User Baru</h2>
          </div>

          <form onSubmit={handleAddUser} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-bold text-slate-500">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-500">Alamat Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@pelindo.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-xs font-bold text-slate-500">Role User</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer font-medium text-slate-700"
                >
                  <option value="admin">Admin IT</option>
                  <option value="staff">Staff IT</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="pass" className="text-xs font-bold text-slate-500">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="pass"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah User</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Side: Users List Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Daftar Pengguna Aktif</span>
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md">
              {initialProfiles.length} Total User
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2.5 pb-3">Nama</th>
                  <th className="py-2.5 pb-3">Email</th>
                  <th className="py-2.5 pb-3">Role</th>
                  <th className="py-2.5 pb-3">Dibuat Pada</th>
                  <th className="py-2.5 pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                {initialProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-2 font-bold text-slate-800">{user.full_name || '-'}</td>
                    <td className="py-3.5 pr-2 text-slate-500 font-medium truncate max-w-[150px]">{user.email}</td>
                    <td className="py-3.5 pr-2">
                      {user.role === 'superadmin' && (
                        <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-md text-[9px] font-bold">
                          Super Admin
                        </span>
                      )}
                      {user.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md text-[9px] font-bold">
                          Admin IT
                        </span>
                      )}
                      {user.role === 'staff' && (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-md text-[9px] font-bold">
                          Staff IT
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(user.created_at)}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      {user.id === currentUserId ? (
                        <span className="text-[10px] text-slate-400 font-bold px-2.5 py-1 bg-slate-50 rounded-lg select-none">
                          Anda
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          disabled={deleteLoadingId === user.id}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {deleteLoadingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            <Trash2 className="w-4 h-4 inline" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  )
}
