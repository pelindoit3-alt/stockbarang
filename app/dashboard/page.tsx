import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

export const dynamic = 'force-dynamic'

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

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

  // 3. Fetch count of profiles
  const { count: userCount, error: userCountError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const displayUserCount = userCountError ? 1 : (userCount || 1)

  // 4. Fetch dynamic stock stats
  const { data: barangList } = await supabase
    .from('barang')
    .select('stock, stock_minimum, harga, is_active, kategori:kategori_id(nama)')

  let totalBarang = 0
  let totalStock = 0
  let stockMenipisCount = 0
  let barangHabisCount = 0
  let totalAsetValue = 0
  const categoryStockMap: Record<string, number> = {}

  if (barangList) {
    totalBarang = barangList.length
    barangList.forEach(b => {
      totalStock += b.stock
      totalAsetValue += b.stock * b.harga
      
      if (b.stock === 0) {
        barangHabisCount++
      } else if (b.stock <= b.stock_minimum) {
        stockMenipisCount++
      }

      if (b.is_active) {
        const catName = b.kategori?.nama || 'Lainnya'
        categoryStockMap[catName] = (categoryStockMap[catName] || 0) + b.stock
      }
    })
  }

  // 5. Fetch transactions today
  const todayStr = new Date().toISOString().split('T')[0]

  const { data: masukToday } = await supabase
    .from('barang_masuk')
    .select('jumlah')
    .eq('tanggal', todayStr)

  const { data: keluarToday } = await supabase
    .from('barang_keluar')
    .select('jumlah')
    .eq('tanggal', todayStr)

  const barangMasukHariIni = masukToday?.reduce((acc, curr) => acc + curr.jumlah, 0) || 0
  const barangKeluarHariIni = keluarToday?.reduce((acc, curr) => acc + curr.jumlah, 0) || 0

  // 6. Fetch pending requests count
  const { count: pendingRequestsCount } = await supabase
    .from('permintaan_barang')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING')

  // 7. Combined Recent Activities (Limit 5 total)
  const { data: recentMasuk } = await supabase
    .from('barang_masuk')
    .select('no_faktur, tanggal, barang:barang_id(nama_barang), jumlah, created_by_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentKeluar } = await supabase
    .from('barang_keluar')
    .select('no_transaksi, tanggal, barang:barang_id(nama_barang), jumlah, created_by_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const activities = [
    ...(recentMasuk || []).map(m => ({
      type: 'Barang Masuk',
      ref: m.no_faktur,
      barang: m.barang?.nama_barang || '-',
      jumlah: m.jumlah,
      user: m.created_by_name || 'Admin',
      created_at: m.created_at,
      color: 'bg-blue-50 text-blue-600'
    })),
    ...(recentKeluar || []).map(k => ({
      type: 'Barang Keluar',
      ref: k.no_transaksi,
      barang: k.barang?.nama_barang || '-',
      jumlah: k.jumlah,
      user: k.created_by_name || 'Admin',
      created_at: k.created_at,
      color: 'bg-rose-50 text-rose-600'
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  // 8. Fetch Recent Requests (Limit 5)
  const { data: recentRequests } = await supabase
    .from('permintaan_barang')
    .select('id, nomor, pemohon_nama, jumlah, status, tanggal, barang:barang_id(nama_barang)')
    .order('created_at', { ascending: false })
    .limit(5)

  // 9. Low stock list for preview (Limit 5)
  const lowStockPreview = (barangList || [])
    .filter(b => b.stock <= b.stock_minimum)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  // Category chart percentages calculation
  const categoryChartData = Object.entries(categoryStockMap)
    .map(([name, stock]) => ({
      name,
      stock,
      percentage: totalStock > 0 ? Math.round((stock / totalStock) * 100) : 0
    }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)

  const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B']

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
    <div className="space-y-8 text-slate-800 animate-fade-in">
      
      {/* HEADER */}
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

      {/* STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Barang */}
        <Link href="/dashboard/barang" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">TOTAL BARANG</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{totalBarang.toLocaleString('id-ID')}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Semua item terdaftar</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Box className="w-6 h-6" />
          </div>
        </Link>

        {/* Total Stock */}
        <Link href="/dashboard/stok" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">TOTAL STOCK</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{totalStock.toLocaleString('id-ID')}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Semua unit stok</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <Layers className="w-6 h-6" />
          </div>
        </Link>

        {/* Barang Masuk Hari Ini */}
        <Link href="/dashboard/barang-masuk" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">BARANG MASUK HARI INI</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{barangMasukHariIni.toLocaleString('id-ID')}</h3>
            <span className="text-[10px] text-emerald-600 font-bold block">Update realtime</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </Link>

        {/* Barang Keluar Hari Ini */}
        <Link href="/dashboard/barang-keluar" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">BARANG KELUAR HARI INI</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{barangKeluarHariIni.toLocaleString('id-ID')}</h3>
            <span className="text-[10px] text-rose-600 font-bold block">Update realtime</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </Link>

        {/* Stock Menipis */}
        <Link href="/dashboard/stok-minimum" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">STOCK MENIPIS</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{stockMenipisCount}</h3>
            <span className="text-[10px] text-amber-600 font-bold block">Perlu perhatian segera</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Link>

        {/* Barang Habis */}
        <Link href="/dashboard/stok-minimum" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">BARANG HABIS</span>
            <h3 className="text-2xl font-extrabold text-rose-600">{barangHabisCount}</h3>
            <span className="text-[10px] text-rose-500 font-semibold block">Segera restock</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all">
            <XCircle className="w-6 h-6" />
          </div>
        </Link>

        {/* Permintaan Pending */}
        <Link href="/dashboard/permintaan" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">PERMINTAAN PENDING</span>
            <h3 className="text-2xl font-extrabold text-purple-600">{pendingRequestsCount}</h3>
            <span className="text-[10px] text-purple-500 font-semibold block">Menunggu persetujuan</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        {/* Nilai Total Aset */}
        <Link href="/dashboard/stok" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold tracking-wider">NILAI TOTAL ASET</span>
            <h3 className="text-sm font-extrabold text-emerald-600 truncate max-w-[140px]">{formatRupiah(totalAsetValue)}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block">Berdasarkan harga barang</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Users className="w-6 h-6" />
          </div>
        </Link>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Chart 1: Estimasi (Faksimile Line Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estimasi Masuk & Keluar</h4>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-extrabold">{barangMasukHariIni + barangKeluarHariIni}</span>
            <span className="text-[10px] text-blue-600 font-bold">Total Transaksi Hari Ini</span>
          </div>
          <div className="h-40 w-full relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="15" x2="100" y2="15" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="45" x2="100" y2="45" stroke="#f1f5f9" strokeWidth="0.5" />
              
              <path d="M 0 50 Q 20 20 40 40 T 80 10 T 100 30 L 100 60 L 0 60 Z" fill="url(#blueGrad)" />
              <path d="M 0 50 Q 20 20 40 40 T 80 10 T 100 30" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-2">
            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span>
          </div>
        </div>

        {/* Chart 2: Stock Berdasarkan Kategori */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-3 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Distribusi Kategori Stok Terbanyak</h4>
            
            <div className="space-y-3">
              {categoryChartData.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">Tidak ada data stok kategori aktif.</p>
              ) : categoryChartData.map((item, idx) => {
                const color = COLORS[idx % COLORS.length]
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.stock.toLocaleString('id-ID')} unit ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="w-full md:w-44 shrink-0 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                {categoryChartData.reduce((acc, curr, idx) => {
  const dashArray = `${curr.percentage} ${100 - curr.percentage}`
  const dashOffset = -acc.currentOffset
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'] // sesuaikan warnamu
  const color = colors[idx % colors.length]

  return {
    currentOffset: acc.currentOffset + curr.percentage,
    accum: [
      ...acc.accum,
      <circle
        key={curr.name}
        cx="18" cy="18" r="15.915"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
      />
    ]
  }
}, { currentOffset: 0, accum: [] as any[] }).accum}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Aktif</span>
                <span className="text-xs font-extrabold text-slate-800">{totalStock.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3 text-[9px] font-bold text-slate-500">
              {categoryChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[60px]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* TABLES BOTTOM GRID */}
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
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">Belum ada aktivitas transaksi.</td>
                    </tr>
                  ) : activities.map((act, i) => (
                    <tr key={i} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3 text-slate-400">{i + 1}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${act.color}`}>{act.type}</span>
                      </td>
                      <td className="py-3 truncate max-w-[120px]" title={act.barang}>{act.barang}</td>
                      <td className="py-3 text-right font-extrabold text-slate-800">{act.jumlah}</td>
                      <td className="py-3 pl-3 text-slate-500 truncate max-w-[80px]">{act.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Link href="/dashboard/barang-masuk" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-4 mt-2 border-t border-slate-100">
            <span>Lihat semua aktivitas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
                  {recentRequests?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">Belum ada permintaan barang.</td>
                    </tr>
                  ) : recentRequests?.map((req, i) => (
                    <tr key={req.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3 text-slate-400">{i + 1}</td>
                      <td className="py-3 truncate max-w-[100px]" title={req.pemohon_nama}>{req.pemohon_nama}</td>
                      <td className="py-3 text-right font-extrabold text-slate-800">{req.jumlah}</td>
                      <td className="py-3 text-center text-slate-400">
                        {new Date(req.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-3 pl-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold block text-center max-w-[70px] uppercase border ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          req.status === 'COMPLETED' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Link href="/dashboard/permintaan" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-4 mt-2 border-t border-slate-100">
            <span>Lihat semua permintaan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
                  {lowStockPreview.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-emerald-600 font-bold">Semua stok aman! ✅</td>
                    </tr>
                  ) : lowStockPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3 truncate max-w-[100px]" title={item.nama_barang}>{item.nama_barang}</td>
                      <td className="py-3 text-center font-extrabold text-slate-800">{item.stock}</td>
                      <td className="py-3 text-center text-slate-400">{item.stock_minimum}</td>
                      <td className="py-3 text-right font-extrabold text-rose-600">{item.stock - item.stock_minimum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Link href="/dashboard/stok-minimum" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-4 mt-2 border-t border-slate-100">
            <span>Lihat semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  )
}
