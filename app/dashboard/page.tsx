import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Box, 
  Layers, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Users,
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  History as HistoryIcon,
  FileSpreadsheet
} from 'lucide-react'


export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get authenticated user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // 3. Fetch actual total user count from Supabase database
  const { count: userCount, error: userCountError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const displayUserCount = userCountError ? 1 : (userCount || 1)

  // Formatting date for dashboard (e.g. "Rabu, 12 Agustus 2026")
  const formatDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const date = new Date()
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} WIB`
  }

  return (
    <div className="space-y-8 text-slate-800">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Selamat datang, <span className="text-blue-600 font-bold">{profile?.full_name || 'User'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-semibold text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate()}</span>
        </div>
      </div>

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Barang */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">TOTAL BARANG</span>
            <h3 className="text-2xl font-extrabold text-slate-900">1,245</h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Semua item</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Box className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">TOTAL STOCK</span>
            <h3 className="text-2xl font-extrabold text-slate-900">3,562</h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Semua stock</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Barang Masuk Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">BARANG MASUK HARI INI</span>
            <h3 className="text-2xl font-extrabold text-slate-900">45</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↑ 12%</span>
              <span className="text-slate-400 font-medium">dari kemarin</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Barang Keluar Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">BARANG KELUAR HARI INI</span>
            <h3 className="text-2xl font-extrabold text-slate-900">32</h3>
            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
              <span>↓ 8%</span>
              <span className="text-slate-400 font-medium">dari kemarin</span>
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Card 5: Stock Menipis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">STOCK MENIPIS</span>
            <h3 className="text-2xl font-extrabold text-slate-900">28</h3>
            <span className="text-[10px] text-amber-600 font-bold block">Perlu perhatian</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 6: Barang Habis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">BARANG HABIS</span>
            <h3 className="text-2xl font-extrabold text-slate-900">7</h3>
            <span className="text-[10px] text-rose-600 font-bold block">Segera restock</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 7: Permintaan Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">PERMINTAAN PENDING</span>
            <h3 className="text-2xl font-extrabold text-slate-900">15</h3>
            <span className="text-[10px] text-purple-600 font-bold block">Menunggu persetujuan</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 8: Total User */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">TOTAL USER</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{displayUserCount}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Semua user</span>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Chart 1: Barang Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Barang Masuk 6 Bulan Terakhir</h4>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-extrabold">340</span>
            <span className="text-[10px] text-blue-600 font-bold">Rata-rata / Bulan</span>
          </div>
          <div className="h-40 w-full relative flex items-end">
            {/* Custom SVG Line Chart */}
            <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="15" x2="100" y2="15" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="45" x2="100" y2="45" stroke="#f1f5f9" strokeWidth="0.5" />
              {/* Chart Gradient Fill */}
              <path d="M 0 60 L 0 45 L 25 50 L 50 40 L 75 35 L 100 15 L 100 60 Z" fill="url(#blueGrad)" />
              {/* Chart Stroke */}
              <path d="M 0 45 L 25 50 L 50 40 L 75 35 L 100 15" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Plot dots */}
              <circle cx="0" cy="45" r="1.5" fill="#2563EB" />
              <circle cx="25" cy="50" r="1.5" fill="#2563EB" />
              <circle cx="50" cy="40" r="1.5" fill="#2563EB" />
              <circle cx="75" cy="35" r="1.5" fill="#2563EB" />
              <circle cx="100" cy="15" r="1.5" fill="#2563EB" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-2">
            <span>Des</span>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>Mei</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center mt-3 text-[10px] text-slate-500 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Jumlah Masuk</span>
          </div>
        </div>

        {/* Chart 2: Barang Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Barang Keluar 6 Bulan Terakhir</h4>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-extrabold">295</span>
            <span className="text-[10px] text-rose-600 font-bold">Rata-rata / Bulan</span>
          </div>
          <div className="h-40 w-full relative flex items-end">
            {/* Custom SVG Line Chart */}
            <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="15" x2="100" y2="15" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="45" x2="100" y2="45" stroke="#f1f5f9" strokeWidth="0.5" />
              <path d="M 0 60 L 0 35 L 25 52 L 50 48 L 75 30 L 100 12 Z" fill="url(#roseGrad)" />
              <path d="M 0 35 L 25 52 L 50 48 L 75 30 L 100 12" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="0" cy="35" r="1.5" fill="#F43F5E" />
              <circle cx="25" cy="52" r="1.5" fill="#F43F5E" />
              <circle cx="50" cy="48" r="1.5" fill="#F43F5E" />
              <circle cx="75" cy="30" r="1.5" fill="#F43F5E" />
              <circle cx="100" cy="12" r="1.5" fill="#F43F5E" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-2">
            <span>Des</span>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>Mei</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center mt-3 text-[10px] text-slate-500 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Jumlah Keluar</span>
          </div>
        </div>

        {/* Chart 3: Perkembangan Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkembangan Stock 6 Bulan Terakhir</h4>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-extrabold">3.8K</span>
            <span className="text-[10px] text-emerald-600 font-bold">Total Nilai Rata-rata</span>
          </div>
          <div className="h-40 w-full relative flex items-end">
            {/* Custom SVG Line Chart */}
            <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="15" x2="100" y2="15" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="45" x2="100" y2="45" stroke="#f1f5f9" strokeWidth="0.5" />
              <path d="M 0 60 L 0 30 L 25 45 L 50 40 L 75 35 L 100 10 Z" fill="url(#emeraldGrad)" />
              <path d="M 0 30 L 25 45 L 50 40 L 75 35 L 100 10" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="0" cy="30" r="1.5" fill="#10B981" />
              <circle cx="25" cy="45" r="1.5" fill="#10B981" />
              <circle cx="50" cy="40" r="1.5" fill="#10B981" />
              <circle cx="75" cy="35" r="1.5" fill="#10B981" />
              <circle cx="100" cy="10" r="1.5" fill="#10B981" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-2">
            <span>Des</span>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>Mei</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center mt-3 text-[10px] text-slate-500 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Total Stock</span>
          </div>
        </div>

        {/* Chart 4: Stock Berdasarkan Kategori */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Stock Berdasarkan Kategori</h4>
            
            <div className="flex items-center justify-center gap-6 my-2">
              {/* Donut Chart representation */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Perangkat (40%) - blue */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563EB" strokeWidth="4" strokeDasharray="40 60" strokeDashoffset="0" />
                  {/* Sparepart (25%) - green */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-40" />
                  {/* Toner (15%) - purple */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="15 85" strokeDashoffset="-65" />
                  {/* Aksesoris (10%) - pink */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EC4899" strokeWidth="4" strokeDasharray="10 90" strokeDashoffset="-80" />
                  {/* Lainnya (10%) - orange */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="10 90" strokeDashoffset="-90" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-slate-400">Mei</span>
                  <span className="text-sm font-extrabold text-slate-800">2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Perangkat (40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Sparepart (25%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>Toner (15%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
              <span>Aksesoris (10%)</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Lainnya (10%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. TABLES BOTTOM GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Table 1: Aktivitas Terbaru (xl:col-span-5) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs xl:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-blue-500" />
                <span>Aktivitas Terbaru</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5 pb-3">No</th>
                    <th className="py-2.5 pb-3">Aktivitas</th>
                    <th className="py-2.5 pb-3">Barang</th>
                    <th className="py-2.5 pb-3 text-right">Jumlah</th>
                    <th className="py-2.5 pb-3 pl-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">15</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px]">Barang Masuk</span></td>
                    <td className="py-3 truncate max-w-[120px]">Laptop Dell Latitude 5440</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">5</td>
                    <td className="py-3 pl-3 text-slate-500 truncate max-w-[80px]">Admin IT</td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">52</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px]">Barang Keluar</span></td>
                    <td className="py-3 truncate max-w-[120px]">Mouse Wireless Logitech</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">2</td>
                    <td className="py-3 pl-3 text-slate-500 truncate max-w-[80px]">Staff IT</td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">30</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px]">Permintaan Disetujui</span></td>
                    <td className="py-3 truncate max-w-[120px]">Keyboard Logitech K120</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">1</td>
                    <td className="py-3 pl-3 text-slate-500 truncate max-w-[80px]">Super Admin</td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">12</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px]">Barang Masuk</span></td>
                    <td className="py-3 truncate max-w-[120px]">SSD 240GB</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">10</td>
                    <td className="py-3 pl-3 text-slate-500 truncate max-w-[80px]">Admin IT</td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">45</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px]">Permintaan Ditolak</span></td>
                    <td className="py-3 truncate max-w-[120px]">Monitor 24 Inch</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">1</td>
                    <td className="py-3 pl-3 text-slate-500 truncate max-w-[80px]">Super Admin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <a href="#" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-4 mt-2 border-t border-slate-100">
            <span>Lihat semua aktivitas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Table 2: Permintaan Terbaru (xl:col-span-4) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs xl:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span>Permintaan Terbaru</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5 pb-3">No</th>
                    <th className="py-2.5 pb-3">Pemohon</th>
                    <th className="py-2.5 pb-3 text-right">Jml</th>
                    <th className="py-2.5 pb-3 text-center">Tanggal</th>
                    <th className="py-2.5 pb-3 pl-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">52</td>
                    <td className="py-3 truncate max-w-[100px]">Budi Santoso</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">2</td>
                    <td className="py-3 text-center text-slate-400">10/05/2025</td>
                    <td className="py-3 pl-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-bold block text-center max-w-[65px]">PENDING</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">51</td>
                    <td className="py-3 truncate max-w-[100px]">Dewi Lestari</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">1</td>
                    <td className="py-3 text-center text-slate-400">10/05/2025</td>
                    <td className="py-3 pl-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-bold block text-center max-w-[65px]">PENDING</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">50</td>
                    <td className="py-3 truncate max-w-[100px]">Ahmad Rizki</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">1</td>
                    <td className="py-3 text-center text-slate-400">09/05/2025</td>
                    <td className="py-3 pl-2"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold block text-center max-w-[65px]">APPROVED</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">49</td>
                    <td className="py-3 truncate max-w-[100px]">Siti Nurhaliza</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">2</td>
                    <td className="py-3 text-center text-slate-400">09/05/2025</td>
                    <td className="py-3 pl-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold block text-center max-w-[65px]">PROCESSING</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 text-slate-400">48</td>
                    <td className="py-3 truncate max-w-[100px]">Andi Pratama</td>
                    <td className="py-3 text-right font-extrabold text-slate-800">3</td>
                    <td className="py-3 text-center text-slate-400">08/05/2025</td>
                    <td className="py-3 pl-2"><span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[9px] font-bold block text-center max-w-[65px]">COMPLETED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <a href="#" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-4 mt-2 border-t border-slate-100">
            <span>Lihat semua permintaan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Table 3: Stock Menipis (xl:col-span-3) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs xl:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Stock Menipis</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5 pb-3">Barang</th>
                    <th className="py-2.5 pb-3 text-center">Stok</th>
                    <th className="py-2.5 pb-3 text-center">Min</th>
                    <th className="py-2.5 pb-3 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 truncate max-w-[100px]">R4</td>
                    <td className="py-3 text-center">3</td>
                    <td className="py-3 text-center text-slate-400">10</td>
                    <td className="py-3 text-right font-extrabold text-rose-600">-7</td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 truncate max-w-[100px]">itech K120</td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-center text-slate-400">5</td>
                    <td className="py-3 text-right font-extrabold text-rose-600">-4</td>
                  </tr>
                  <tr className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 truncate max-w-[100px]">ss Logitech</td>
                    <td className="py-3 text-center">2</td>
                    <td className="py-3 text-center text-slate-400">5</td>
                    <td className="py-3 text-right font-extrabold text-rose-600">-3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <a href="#" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-4 mt-2 border-t border-slate-100">
            <span>Lihat semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

    </div>
  )
}
