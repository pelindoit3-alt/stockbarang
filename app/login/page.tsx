'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Package, 
  ArrowUpRight, 
  TrendingUp, 
  FileText,
  LogIn
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  // State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Silakan masukkan email dan password Anda.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' 
          ? 'Email atau password salah. Silakan coba lagi.' 
          : error.message
        )
        setLoading(false)
        return
      }

      // Check if profile exists and get role
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          // If profile is missing, sign out and throw error
          await supabase.auth.signOut()
          setErrorMsg('Profil user tidak ditemukan. Hubungi Administrator IT.')
          setLoading(false)
          return
        }

        // Successfully authenticated, let middleware handle redirect or router direct
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full font-sans bg-slate-50 text-slate-800">
      
      {/* LEFT PANEL - Branding & Hero */}
      <div className="relative hidden w-1/2 md:flex flex-col justify-between p-12 overflow-hidden text-white">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/port_bg.jpg"
            alt="Pelindo Port"
            fill
            priority
            className="object-cover"
          />
          {/* Deep Navy/Teal Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/85 to-blue-900/70" />
        </div>

        {/* Pelindo Logo */}
        <div className="relative z-10 flex items-start">
          <Image
            src="/image/logopelindo.png"
            alt="Pelindo Logo"
            width={360}
            height={100}
            priority
            className="h-16 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Center Main Text */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Sistem
            Informasi<br />
            Barang
            Divisi IT
          </h1>
          <p className="text-base text-slate-200 leading-relaxed font-light">
            Sistem terintegrasi untuk pengelolaan barang masuk, barang keluar, 
            dan stok inventaris pada Divisi Teknologi Informasi.
          </p>

          {/* Features Checklist */}
          <div className="space-y-4 pt-6">
            
            {/* Feature 1 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30 shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Kelola Barang Masuk</h3>
                <p className="text-xs text-slate-300">Catat dan monitor semua barang yang masuk ke divisi IT</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30 shrink-0">
                <ArrowUpRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Kelola Barang Keluar</h3>
                <p className="text-xs text-slate-300">Permintaan dan pengeluaran barang dengan mudah dan terkontrol</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600 shadow-lg shadow-purple-600/30 shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Monitoring Stok</h3>
                <p className="text-xs text-slate-300">Pantau ketersediaan stok barang secara realtime</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30 shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Laporan Lengkap</h3>
                <p className="text-xs text-slate-300">Cetak laporan barang masuk, keluar, dan stok secara otomatis</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-400">
          &copy; 2026 PT Pelabuhan Indonesia
        </div>
      </div>

      {/* RIGHT PANEL - Login Card Form */}
      <div className="flex flex-col justify-between w-full md:w-1/2 p-6 md:p-12 bg-slate-50">
        
        {/* Top spacer (hidden on mobile, useful for aligning layout) */}
        <div className="hidden md:block" />

        {/* Main Card */}
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100/50 border border-slate-100 self-center my-auto transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40">
          
          {/* Card Icon */}
          <div className="relative w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 bg-[#0A3E76] text-white rounded-lg border-2 border-white shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Selamat Datang Kembali!</h2>
            <p className="text-sm text-slate-400">Silakan masuk untuk melanjutkan</p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium flex items-center gap-2 animate-shake">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-500 block">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-600 transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-500 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-600 transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                Lupa password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Belum memiliki akun */}
          <div className="mt-8 text-center text-xs font-medium text-slate-400">
            Belum memiliki akun?{' '}
            <a href="#" className="text-blue-600 hover:underline font-semibold">
              Hubungi Administrator IT
            </a>
          </div>

        </div>

        {/* App Version Info */}
        <div className="text-center text-xs text-slate-400 pt-6">
          Sistem Informasi Barang Divisi IT v1.0.0
        </div>

      </div>

    </div>
  )
}
