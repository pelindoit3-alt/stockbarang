'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Box, 
  Tags, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Database, 
  AlertTriangle, 
  FileText, 
  Users, 
  History, 
  Settings, 
  Menu, 
  Bell, 
  ChevronDown, 
  LogOut,
  X,
  User as UserIcon
} from 'lucide-react'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  profile: {
    email: string
    role: string
    full_name: string
  }
}

export default function DashboardLayoutClient({ children, profile }: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Navigation Items definitions
  const menuGroups = [
    {
      title: 'MASTER DATA',
      items: [
        { name: 'Barang', href: '/dashboard/barang', icon: Box },
        { name: 'Kategori', href: '/dashboard/kategori', icon: Tags },
      ]
    },
    {
      title: 'TRANSAKSI',
      items: [
        { name: 'Barang Masuk', href: '/dashboard/barang-masuk', icon: ArrowDownLeft },
        { name: 'Barang Keluar', href: '/dashboard/barang-keluar', icon: ArrowUpRight },
        { name: 'Permintaan Barang', href: '/dashboard/permintaan', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'STOCK',
      items: [
        { name: 'Stock Barang', href: '/dashboard/stok', icon: Database },
        { name: 'Stock Minimum', href: '/dashboard/stok-minimum', icon: AlertTriangle },
      ]
    },
    {
      title: 'LAPORAN',
      items: [
        { name: 'Laporan Barang Masuk', href: '/dashboard/laporan-masuk', icon: FileText },
        { name: 'Laporan Barang Keluar', href: '/dashboard/laporan-keluar', icon: FileText },
        { name: 'Laporan Stock', href: '/dashboard/laporan-stok', icon: FileText },
        { name: 'Laporan Permintaan', href: '/dashboard/laporan-permintaan', icon: FileText },
      ]
    }
  ]

  // Add Admin tools (conditional)
  const adminGroup = {
    title: 'PENGATURAN',
    items: [
      ...(profile.role === 'superadmin' ? [
        { name: 'Manajemen User', href: '/dashboard/users', icon: Users }
      ] : []),
      { name: 'Audit Log', href: '/dashboard/audit-log', icon: History },
      { name: 'Pengaturan', href: '/dashboard/pengaturan', icon: Settings },
    ]
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9] font-sans">
      
      {/* 1. SIDEBAR (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0a1829] text-slate-300 transition-transform duration-300 transform border-r border-[#0f243d] md:translate-x-0 md:static md:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-[#081321] border-b border-[#0f243d]">
          <div className="flex items-center">
            <Image
              src="/image/logopelindo.png"
              alt="Pelindo Logo"
              width={360}
              height={100}
              priority
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 rounded-lg hover:bg-slate-800 md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Main Dashboard Link */}
          <div>
            <Link 
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === '/dashboard' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' 
                  : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Render Groups */}
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <h4 className="px-3 text-[10px] font-bold tracking-wider text-slate-500">{group.title}</h4>
              <div className="space-y-0.5">
                {group.items.map((item, iIdx) => (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      pathname === item.href 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' 
                        : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Render Admin/Settings Group */}
          <div className="space-y-1.5 pt-2 border-t border-[#0f243d]">
            <h4 className="px-3 text-[10px] font-bold tracking-wider text-slate-500">{adminGroup.title}</h4>
            <div className="space-y-0.5">
              {adminGroup.items.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    pathname === item.href 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' 
                      : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-[#081321] border-t border-[#0f243d] text-center space-y-1">
          <div className="text-[10px] text-slate-500 font-semibold truncate">PT Pelabuhan Indonesia (Persero)</div>
          <div className="text-[9px] text-slate-600">© 2026 Pelindo IT v1.0.0</div>
        </div>

      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="flex items-center justify-between h-16 px-6 bg-[#0a1829] text-white border-b border-[#0f243d] shrink-0">
          
          {/* Left Area: Hamburger and App title */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-1 rounded-lg hover:bg-slate-800 md:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden sm:flex flex-col">
              <h2 className="text-sm font-bold tracking-wide text-white leading-tight">Sistem Informasi Barang Divisi IT</h2>
              <span className="text-[10px] text-slate-400 font-medium">PT Pelabuhan Indonesia (Persero)</span>
            </div>
          </div>

          {/* Right Area: Actions, Notification & User Dropdown */}
          <div className="flex items-center gap-4">
            
            {/* Notifications */}
            <button className="relative p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-[9px] font-extrabold text-white rounded-full">
                2
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-800" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-800 transition-colors text-left focus:outline-none"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/30">
                  {profile.full_name ? profile.full_name.charAt(0) : 'U'}
                </div>
                {/* Details */}
                <div className="hidden md:flex flex-col">
                  <div className="text-xs font-bold text-slate-100 max-w-[120px] truncate leading-tight">
                    {profile.full_name || 'Super Admin'}
                  </div>
                  <span className="text-[9px] text-[#00ADEF] font-semibold tracking-wider capitalize leading-none pt-0.5">
                    {profile.role === 'superadmin' ? 'Super Admin' : profile.role}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div 
                    onClick={() => setUserDropdownOpen(false)} 
                    className="fixed inset-0 z-10"
                  />
                  <div className="absolute right-0 mt-2 z-20 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 text-slate-700 animate-slide-down">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-800 truncate">{profile.full_name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{profile.email}</div>
                    </div>
                    
                    <Link 
                      href="/dashboard/pengaturan" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Edit Profil</span>
                    </Link>
                    
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-rose-50 text-rose-600 transition-colors border-t border-slate-100 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Sistem</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>

      </div>

    </div>
  )
}
